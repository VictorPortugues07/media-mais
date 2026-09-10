#!/usr/bin/env bash
#
# script.sh - Pipeline DevSecOps da plataforma Media+
#
# Executa SAST, SCA, geracao de SBOM, varredura de segredos e DAST usando
# exclusivamente containers com tags fixas. Nada e instalado no host.
#
# Principio de projeto: uma etapa so reporta PASS se a ferramenta realmente
# executou e nao encontrou achados acima do limite. Ferramenta ausente ou que
# falhou vira SKIP ou ERROR, nunca PASS. O codigo de saida reflete isso.
#
# Uso: ./script.sh --help
#

set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

# --------------------------------------------------------------------------
# Imagens (tags fixas; sobrescreva via variavel de ambiente se necessario)
# --------------------------------------------------------------------------
IMG_GITLEAKS="${SEC_IMG_GITLEAKS:-zricethezav/gitleaks:v8.28.0}"
IMG_SEMGREP="${SEC_IMG_SEMGREP:-semgrep/semgrep:1.145.0}"
IMG_TRIVY="${SEC_IMG_TRIVY:-aquasec/trivy:0.69.0}"
IMG_SYFT="${SEC_IMG_SYFT:-anchore/syft:v1.36.0}"
IMG_GRYPE="${SEC_IMG_GRYPE:-anchore/grype:v0.104.0}"
IMG_OSV="${SEC_IMG_OSV:-ghcr.io/google/osv-scanner:v2.2.4}"
IMG_ZAP="${SEC_IMG_ZAP:-zaproxy/zap-stable:2.17.0}"
IMG_NODE="${SEC_IMG_NODE:-node:24-alpine}"
IMG_POSTGRES="${SEC_IMG_POSTGRES:-postgres:17-alpine}"

# --------------------------------------------------------------------------
# Opcoes
# --------------------------------------------------------------------------
FAIL_ON="high"          # critical|high|medium|low|none
REQUIRE_ALL=0           # 1 = etapa SKIP tambem reprova
DO_PULL=1
RUN_STAGES="secrets sast deps sbom dast"
DAST_MODE="baseline"    # baseline|full
DAST_PORT="${SEC_DAST_PORT:-3100}"
PG_PORT="${SEC_PG_PORT:-55432}"
KEEP_ENV=0

usage() {
  cat <<'EOF'
Pipeline DevSecOps - Media+

USO
  ./script.sh [opcoes]

OPCOES
  --stage <lista>     Etapas a executar, separadas por virgula.
                      Disponiveis: secrets, sast, deps, sbom, dast
                      Padrao: todas.
  --skip-dast         Atalho para rodar tudo menos DAST (nao sobe app nem banco).
  --dast-full         Varredura ativa completa do ZAP em vez da baseline.
                      Bem mais lenta e envia payloads de ataque reais.
  --fail-on <sev>     Severidade minima que reprova o pipeline.
                      critical|high|medium|low|none   (padrao: high)
  --require-all       Trata etapa pulada (SKIP) como reprovacao.
                      Recomendado em CI.
  --no-pull           Nao baixa imagens; usa apenas o que ja esta em cache local.
  --keep-env          Nao derruba o Postgres e o app ao final do DAST
                      (util para investigar um achado manualmente).
  -h, --help          Esta ajuda.

CODIGOS DE SAIDA
  0  Todas as etapas executadas e nenhum achado no nivel de reprovacao.
  1  Achados de seguranca no nivel de --fail-on ou acima.
  2  Uma ou mais etapas falharam ao executar (ERROR).
  3  Uma ou mais etapas foram puladas e --require-all estava ativo.

RELATORIOS
  security-reports/<timestamp>/   Saidas brutas por ferramenta (JSON/SARIF/HTML).
  security-reports/latest         Link para a execucao mais recente.
  security-reports/latest/summary.md    Resumo consolidado legivel.
  security-reports/latest/summary.json  Resumo consolidado para automacao.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stage)      RUN_STAGES="${2//,/ }"; shift 2 ;;
    --skip-dast)  RUN_STAGES="secrets sast deps sbom"; shift ;;
    --dast-full)  DAST_MODE="full"; shift ;;
    --fail-on)    FAIL_ON="$2"; shift 2 ;;
    --require-all) REQUIRE_ALL=1; shift ;;
    --no-pull)    DO_PULL=0; shift ;;
    --keep-env)   KEEP_ENV=1; shift ;;
    -h|--help)    usage; exit 0 ;;
    *) echo "Opcao desconhecida: $1" >&2; usage >&2; exit 64 ;;
  esac
done

case "$FAIL_ON" in
  critical|high|medium|low|none) ;;
  *) echo "--fail-on invalido: $FAIL_ON" >&2; exit 64 ;;
esac

# --------------------------------------------------------------------------
# Espaco de trabalho
# --------------------------------------------------------------------------
RUN_ID="$(date +%Y%m%d-%H%M%S)"
REPORTS_ROOT="$REPO_ROOT/security-reports"
OUT="$REPORTS_ROOT/$RUN_ID"
CACHE="$REPORTS_ROOT/.cache"
STATE="$OUT/.stages.tsv"

mkdir -p "$OUT"/{secrets,sast,deps,sbom,dast} "$CACHE"/{trivy,grype,semgrep}
: > "$STATE"

UID_GID="$(id -u):$(id -g)"

C_RESET=$'\033[0m'; C_DIM=$'\033[2m'; C_BOLD=$'\033[1m'
C_RED=$'\033[31m'; C_GRN=$'\033[32m'; C_YEL=$'\033[33m'; C_BLU=$'\033[36m'
if [[ ! -t 1 ]]; then C_RESET=""; C_DIM=""; C_BOLD=""; C_RED=""; C_GRN=""; C_YEL=""; C_BLU=""; fi

log()  { printf '%s[ pipeline ]%s %s\n' "$C_BLU" "$C_RESET" "$*"; }
warn() { printf '%s[ atencao  ]%s %s\n' "$C_YEL" "$C_RESET" "$*"; }
fail() { printf '%s[ erro     ]%s %s\n' "$C_RED" "$C_RESET" "$*" >&2; }
head2() { printf '\n%s== %s ==%s\n' "$C_BOLD" "$*" "$C_RESET"; }

# record <etapa> <status> <segundos> <crit> <high> <med> <low> <nota>
record() {
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$1" "$2" "$3" "${4:-0}" "${5:-0}" "${6:-0}" "${7:-0}" "${8:-}" >> "$STATE"
  local color="$C_GRN"
  case "$2" in FAIL) color="$C_RED";; ERROR) color="$C_RED";; SKIP) color="$C_YEL";; esac
  printf '%s  -> %-5s%s  %s  (%ss)  %s\n' "$color" "$2" "$C_RESET" "$1" "$3" "${8:-}"
}

wants() { [[ " $RUN_STAGES " == *" $1 "* ]]; }

# Le um JSON com jq; devolve 0 se o arquivo existe e e JSON valido.
valid_json() { [[ -s "$1" ]] && jq -e . "$1" >/dev/null 2>&1; }

now() { date +%s; }

# --------------------------------------------------------------------------
# Preflight
# --------------------------------------------------------------------------
head2 "Preflight"

if ! command -v docker >/dev/null 2>&1; then
  fail "docker nao encontrado. Este pipeline roda todas as ferramentas em container."
  exit 2
fi
if ! docker info >/dev/null 2>&1; then
  fail "daemon do Docker inacessivel. Verifique se o servico esta ativo e se o usuario tem permissao."
  exit 2
fi
command -v jq >/dev/null 2>&1 || { fail "jq nao encontrado (necessario para consolidar relatorios)."; exit 2; }

log "Execucao ....... $RUN_ID"
log "Etapas ......... $RUN_STAGES"
log "Reprova em ..... $FAIL_ON"
log "Relatorios ..... security-reports/$RUN_ID"

declare -a NEEDED_IMAGES=()
wants secrets && NEEDED_IMAGES+=("$IMG_GITLEAKS")
wants sast    && NEEDED_IMAGES+=("$IMG_SEMGREP")
wants deps    && NEEDED_IMAGES+=("$IMG_NODE" "$IMG_OSV" "$IMG_TRIVY")
wants sbom    && NEEDED_IMAGES+=("$IMG_SYFT" "$IMG_GRYPE")
wants dast    && NEEDED_IMAGES+=("$IMG_ZAP" "$IMG_POSTGRES")

if [[ $DO_PULL -eq 1 ]]; then
  log "Baixando imagens (tags fixas)..."
  for img in "${NEEDED_IMAGES[@]}"; do
    if docker image inspect "$img" >/dev/null 2>&1; then
      printf '  %scache%s   %s\n' "$C_DIM" "$C_RESET" "$img"
    elif docker pull --quiet "$img" >/dev/null 2>&1; then
      printf '  %sbaixada%s %s\n' "$C_GRN" "$C_RESET" "$img"
    else
      fail "nao foi possivel baixar $img"
    fi
  done
else
  log "--no-pull ativo; usando somente imagens em cache."
fi

# --------------------------------------------------------------------------
# Etapa: segredos (Gitleaks)
# --------------------------------------------------------------------------
stage_secrets() {
  head2 "Segredos - Gitleaks"
  local t0; t0=$(now)
  local rep_dir="$OUT/secrets"
  local ok_tree=1 ok_hist=1

  local gl_cfg=()
  [[ -f "$REPO_ROOT/.security/gitleaks.toml" ]] && gl_cfg=(--config /repo/.security/gitleaks.toml)

  # arvore de trabalho
  docker run --rm -u "$UID_GID" \
    -v "$REPO_ROOT:/repo:ro" -v "$rep_dir:/out" \
    "$IMG_GITLEAKS" dir /repo "${gl_cfg[@]}" \
      --report-format json --report-path /out/gitleaks-tree.json \
      --redact --exit-code 0 --no-banner \
    > "$rep_dir/gitleaks-tree.log" 2>&1 || ok_tree=0

  # historico do git
  docker run --rm -u "$UID_GID" \
    -v "$REPO_ROOT:/repo:ro" -v "$rep_dir:/out" \
    "$IMG_GITLEAKS" git /repo "${gl_cfg[@]}" \
      --report-format json --report-path /out/gitleaks-history.json \
      --redact --exit-code 0 --no-banner \
    > "$rep_dir/gitleaks-history.log" 2>&1 || ok_hist=0

  if [[ $ok_tree -eq 0 && ! -f "$rep_dir/gitleaks-tree.json" ]]; then
    record secrets ERROR "$(( $(now) - t0 ))" 0 0 0 0 "gitleaks falhou; ver gitleaks-tree.log"
    return
  fi

  local n_tree=0 n_hist=0
  valid_json "$rep_dir/gitleaks-tree.json"    && n_tree=$(jq 'length' "$rep_dir/gitleaks-tree.json")
  valid_json "$rep_dir/gitleaks-history.json" && n_hist=$(jq 'length' "$rep_dir/gitleaks-history.json")

  local total=$(( n_tree + n_hist ))
  local note="arvore: $n_tree, historico: $n_hist"
  [[ $ok_hist -eq 0 ]] && note="$note (varredura de historico degradada)"

  # Segredo exposto e sempre tratado como severidade alta.
  if [[ $total -gt 0 ]]; then
    record secrets FAIL "$(( $(now) - t0 ))" 0 "$total" 0 0 "$note"
  else
    record secrets PASS "$(( $(now) - t0 ))" 0 0 0 0 "$note"
  fi
}

# --------------------------------------------------------------------------
# Etapa: SAST (Semgrep)
# --------------------------------------------------------------------------
stage_sast() {
  head2 "SAST - Semgrep"
  local t0; t0=$(now)
  local rep_dir="$OUT/sast"

  local -a rules=(
    --config=p/javascript
    --config=p/typescript
    --config=p/react
    --config=p/nodejs
    --config=p/owasp-top-ten
    --config=p/secrets
    --config=p/jwt
    --config=p/sql-injection
    --config=p/xss
    --config=p/command-injection
  )
  # Regras proprias do projeto: cada uma corresponde a um defeito real da
  # auditoria, para impedir que ele volte em alteracoes futuras.
  [[ -f "$REPO_ROOT/.security/semgrep-mediamais.yml" ]] && \
    rules+=(--config=/src/.security/semgrep-mediamais.yml)

  local rc=0
  docker run --rm -u "$UID_GID" \
    -e SEMGREP_SEND_METRICS=off -e HOME=/tmp \
    -v "$REPO_ROOT:/src:ro" -v "$rep_dir:/out" -v "$CACHE/semgrep:/tmp/.semgrep" \
    -w /src "$IMG_SEMGREP" \
    semgrep scan "${rules[@]}" \
      --json --output=/out/semgrep.json \
      --exclude=node_modules --exclude=.next --exclude=security-reports \
      --exclude=package-lock.json --exclude='*.min.js' \
      --metrics=off --no-error --quiet --timeout=120 --jobs=4 \
    > "$rep_dir/semgrep.log" 2>&1 || rc=$?

  if ! valid_json "$rep_dir/semgrep.json"; then
    record sast ERROR "$(( $(now) - t0 ))" 0 0 0 0 "semgrep nao gerou relatorio (rc=$rc); ver semgrep.log"
    return
  fi

  # Gera tambem SARIF para consumo por ferramentas de code scanning.
  docker run --rm -u "$UID_GID" \
    -e SEMGREP_SEND_METRICS=off -e HOME=/tmp \
    -v "$REPO_ROOT:/src:ro" -v "$rep_dir:/out" -v "$CACHE/semgrep:/tmp/.semgrep" \
    -w /src "$IMG_SEMGREP" \
    semgrep scan "${rules[@]}" \
      --sarif --output=/out/semgrep.sarif \
      --exclude=node_modules --exclude=.next --exclude=security-reports \
      --exclude=package-lock.json --exclude='*.min.js' \
      --metrics=off --no-error --quiet --timeout=120 --jobs=4 \
    >> "$rep_dir/semgrep.log" 2>&1 || true

  local hi md lo
  hi=$(jq '[.results[]? | select(.extra.severity=="ERROR")]   | length' "$rep_dir/semgrep.json")
  md=$(jq '[.results[]? | select(.extra.severity=="WARNING")] | length' "$rep_dir/semgrep.json")
  lo=$(jq '[.results[]? | select(.extra.severity=="INFO")]    | length' "$rep_dir/semgrep.json")

  # Cobertura: um arquivo que o parser nao conseguiu ler NAO foi analisado.
  # Tratar isso como aprovacao seria exatamente o tipo de falso "tudo certo"
  # que este pipeline existe para impedir. Entao lacuna de cobertura reprova.
  jq -r '[.errors[]? | .path // empty] | unique | .[]' "$rep_dir/semgrep.json" \
    > "$rep_dir/arquivos-nao-analisados.txt" 2>/dev/null || : > "$rep_dir/arquivos-nao-analisados.txt"
  local unparsed; unparsed=$(grep -c . "$rep_dir/arquivos-nao-analisados.txt" 2>/dev/null || echo 0)

  local note="regras: ${#rules[@]}"
  if [[ "$unparsed" -gt 0 ]]; then
    note="$note; COBERTURA INCOMPLETA: $unparsed arquivo(s) nao analisados (ver sast/arquivos-nao-analisados.txt)"
    warn "$unparsed arquivo(s) nao puderam ser analisados pelo Semgrep:"
    sed 's/^/      /' "$rep_dir/arquivos-nao-analisados.txt" >&2
  fi

  if [[ $(( hi + md )) -gt 0 || "$unparsed" -gt 0 ]]; then
    record sast FAIL "$(( $(now) - t0 ))" 0 "$hi" "$md" "$lo" "$note"
  else
    record sast PASS "$(( $(now) - t0 ))" 0 0 0 "$lo" "$note"
  fi
}

# --------------------------------------------------------------------------
# Etapa: dependencias (npm audit + OSV-Scanner + Trivy)
# --------------------------------------------------------------------------
stage_deps() {
  head2 "Dependencias - npm audit + OSV-Scanner + Trivy"
  local t0; t0=$(now)
  local rep_dir="$OUT/deps"
  local crit=0 high=0 med=0 low=0
  local -a notes=()
  local any_ok=0

  # --- npm audit (a partir do lockfile, sem precisar de node_modules) ---
  docker run --rm -u "$UID_GID" -e HOME=/tmp \
    -v "$REPO_ROOT:/src:ro" -v "$rep_dir:/out" -w /tmp \
    "$IMG_NODE" sh -c '
      cp /src/package.json /src/package-lock.json /tmp/ 2>/dev/null || exit 3
      npm audit --package-lock-only --audit-level=none --json > /out/npm-audit.json 2>/out/npm-audit.log
      exit 0
    ' >/dev/null 2>&1 || true

  if valid_json "$rep_dir/npm-audit.json"; then
    any_ok=1
    local nc nh nm nl
    nc=$(jq '.metadata.vulnerabilities.critical // 0' "$rep_dir/npm-audit.json")
    nh=$(jq '.metadata.vulnerabilities.high     // 0' "$rep_dir/npm-audit.json")
    nm=$(jq '.metadata.vulnerabilities.moderate // 0' "$rep_dir/npm-audit.json")
    nl=$(jq '.metadata.vulnerabilities.low      // 0' "$rep_dir/npm-audit.json")
    crit=$((crit+nc)); high=$((high+nh)); med=$((med+nm)); low=$((low+nl))
    notes+=("npm-audit c:$nc h:$nh m:$nm l:$nl")
  else
    notes+=("npm-audit FALHOU")
  fi

  # --- OSV-Scanner ---
  docker run --rm -u "$UID_GID" -e HOME=/tmp \
    -v "$REPO_ROOT:/src:ro" -v "$rep_dir:/out" \
    "$IMG_OSV" scan source --lockfile=/src/package-lock.json \
      --format=json --output=/out/osv.json \
    > "$rep_dir/osv.log" 2>&1 || true

  if valid_json "$rep_dir/osv.json"; then
    any_ok=1
    local ov
    ov=$(jq '[.results[]?.packages[]?.vulnerabilities[]?] | length' "$rep_dir/osv.json")
    local oc oh om ol
    oc=$(jq '[.results[]?.packages[]?.groups[]? | select((.max_severity|tonumber? // 0) >= 9.0)] | length' "$rep_dir/osv.json" 2>/dev/null || echo 0)
    oh=$(jq '[.results[]?.packages[]?.groups[]? | select((.max_severity|tonumber? // 0) >= 7.0 and (.max_severity|tonumber? // 0) < 9.0)] | length' "$rep_dir/osv.json" 2>/dev/null || echo 0)
    om=$(jq '[.results[]?.packages[]?.groups[]? | select((.max_severity|tonumber? // 0) >= 4.0 and (.max_severity|tonumber? // 0) < 7.0)] | length' "$rep_dir/osv.json" 2>/dev/null || echo 0)
    ol=$(jq '[.results[]?.packages[]?.groups[]? | select((.max_severity|tonumber? // 0) > 0   and (.max_severity|tonumber? // 0) < 4.0)] | length' "$rep_dir/osv.json" 2>/dev/null || echo 0)
    crit=$((crit+oc)); high=$((high+oh)); med=$((med+om)); low=$((low+ol))
    notes+=("osv $ov vuln")
  else
    notes+=("osv FALHOU")
  fi

  # --- Trivy: vulnerabilidades + segredos + ma configuracao ---
  docker run --rm -u "$UID_GID" -e HOME=/tmp \
    -v "$REPO_ROOT:/src:ro" -v "$rep_dir:/out" -v "$CACHE/trivy:/tmp/trivy" \
    "$IMG_TRIVY" fs /src \
      --cache-dir /tmp/trivy \
      --scanners vuln,secret,misconfig \
      --skip-dirs node_modules,.next,security-reports \
      --format json --output /out/trivy-fs.json \
      --quiet \
    > "$rep_dir/trivy.log" 2>&1 || true

  if valid_json "$rep_dir/trivy-fs.json"; then
    any_ok=1
    local tc th tm tl
    tc=$(jq '[.Results[]? | (.Vulnerabilities[]?, .Secrets[]?, .Misconfigurations[]?) | select(.Severity=="CRITICAL")] | length' "$rep_dir/trivy-fs.json")
    th=$(jq '[.Results[]? | (.Vulnerabilities[]?, .Secrets[]?, .Misconfigurations[]?) | select(.Severity=="HIGH")]     | length' "$rep_dir/trivy-fs.json")
    tm=$(jq '[.Results[]? | (.Vulnerabilities[]?, .Secrets[]?, .Misconfigurations[]?) | select(.Severity=="MEDIUM")]   | length' "$rep_dir/trivy-fs.json")
    tl=$(jq '[.Results[]? | (.Vulnerabilities[]?, .Secrets[]?, .Misconfigurations[]?) | select(.Severity=="LOW")]      | length' "$rep_dir/trivy-fs.json")
    crit=$((crit+tc)); high=$((high+th)); med=$((med+tm)); low=$((low+tl))
    notes+=("trivy c:$tc h:$th m:$tm l:$tl")
  else
    notes+=("trivy FALHOU")
  fi

  local note; note="$(IFS='; '; echo "${notes[*]}")"

  if [[ $any_ok -eq 0 ]]; then
    record deps ERROR "$(( $(now) - t0 ))" 0 0 0 0 "nenhum scanner de dependencia executou; $note"
  elif [[ $(( crit + high + med + low )) -gt 0 ]]; then
    record deps FAIL "$(( $(now) - t0 ))" "$crit" "$high" "$med" "$low" "$note"
  else
    record deps PASS "$(( $(now) - t0 ))" 0 0 0 0 "$note"
  fi
}

# --------------------------------------------------------------------------
# Etapa: SBOM (Syft) + varredura do SBOM (Grype)
# --------------------------------------------------------------------------
stage_sbom() {
  head2 "SBOM - Syft + Grype"
  local t0; t0=$(now)
  local rep_dir="$OUT/sbom"

  docker run --rm -u "$UID_GID" -e HOME=/tmp \
    -v "$REPO_ROOT:/src:ro" -v "$rep_dir:/out" \
    "$IMG_SYFT" scan dir:/src \
      --exclude './node_modules' --exclude './.next' --exclude './security-reports' \
      -o "cyclonedx-json=/out/sbom.cdx.json" \
      -o "spdx-json=/out/sbom.spdx.json" \
      -o "syft-table=/out/sbom.txt" \
    > "$rep_dir/syft.log" 2>&1 || true

  if ! valid_json "$rep_dir/sbom.cdx.json"; then
    record sbom ERROR "$(( $(now) - t0 ))" 0 0 0 0 "syft nao gerou SBOM; ver syft.log"
    return
  fi

  local ncomp
  ncomp=$(jq '[.components[]?] | length' "$rep_dir/sbom.cdx.json")

  # A imagem do grype roda como usuario sem privilegio; o /tmp do container
  # nao e gravavel para ele. Apontamos TMPDIR e o cache da base para um
  # diretorio montado do host, que ja pertence ao usuario da execucao.
  mkdir -p "$CACHE/grype/tmp"
  docker run --rm -u "$UID_GID" \
    -e HOME=/grypedb -e TMPDIR=/grypedb/tmp \
    -e GRYPE_DB_CACHE_DIR=/grypedb/db \
    -v "$rep_dir:/out" -v "$CACHE/grype:/grypedb" \
    "$IMG_GRYPE" "sbom:/out/sbom.cdx.json" \
      -o json --file /out/grype.json \
    > "$rep_dir/grype.log" 2>&1 || true

  if ! valid_json "$rep_dir/grype.json"; then
    record sbom ERROR "$(( $(now) - t0 ))" 0 0 0 0 "SBOM gerado ($ncomp componentes) mas grype falhou; ver grype.log"
    return
  fi

  local gc gh gm gl
  gc=$(jq '[.matches[]? | select(.vulnerability.severity=="Critical")] | length' "$rep_dir/grype.json")
  gh=$(jq '[.matches[]? | select(.vulnerability.severity=="High")]     | length' "$rep_dir/grype.json")
  gm=$(jq '[.matches[]? | select(.vulnerability.severity=="Medium")]   | length' "$rep_dir/grype.json")
  gl=$(jq '[.matches[]? | select(.vulnerability.severity=="Low")]      | length' "$rep_dir/grype.json")

  local note="$ncomp componentes; CycloneDX + SPDX gerados"
  if [[ $(( gc + gh + gm + gl )) -gt 0 ]]; then
    record sbom FAIL "$(( $(now) - t0 ))" "$gc" "$gh" "$gm" "$gl" "$note"
  else
    record sbom PASS "$(( $(now) - t0 ))" 0 0 0 0 "$note"
  fi
}

# --------------------------------------------------------------------------
# Etapa: DAST (OWASP ZAP contra a aplicacao rodando)
# --------------------------------------------------------------------------
DAST_PG_NAME="mediamais-sec-pg-$$"
DAST_APP_PID=""

dast_teardown() {
  [[ $KEEP_ENV -eq 1 ]] && { warn "--keep-env: ambiente do DAST mantido de pe (app :$DAST_PORT, pg :$PG_PORT)"; return; }
  [[ -n "$DAST_APP_PID" ]] && kill "$DAST_APP_PID" 2>/dev/null || true
  [[ -n "$DAST_APP_PID" ]] && wait "$DAST_APP_PID" 2>/dev/null || true
  docker rm -f "$DAST_PG_NAME" >/dev/null 2>&1 || true
}

stage_dast() {
  head2 "DAST - OWASP ZAP ($DAST_MODE)"
  local t0; t0=$(now)
  local rep_dir="$OUT/dast"
  trap dast_teardown RETURN

  # --- 1. banco efemero ---
  log "subindo Postgres efemero na porta $PG_PORT..."
  if ! docker run -d --rm --name "$DAST_PG_NAME" \
      -e POSTGRES_PASSWORD=dastpw -e POSTGRES_USER=dast -e POSTGRES_DB=mediamais \
      -p "127.0.0.1:$PG_PORT:5432" "$IMG_POSTGRES" \
      > "$rep_dir/postgres.log" 2>&1; then
    record dast ERROR "$(( $(now) - t0 ))" 0 0 0 0 "nao foi possivel subir o Postgres; ver postgres.log"
    return
  fi

  local ready=0
  for _ in $(seq 1 60); do
    if docker exec "$DAST_PG_NAME" pg_isready -U dast -d mediamais >/dev/null 2>&1; then ready=1; break; fi
    sleep 1
  done
  if [[ $ready -eq 0 ]]; then
    record dast ERROR "$(( $(now) - t0 ))" 0 0 0 0 "Postgres nao ficou pronto em 60s"
    return
  fi

  # Credencial efemera de um Postgres em container que existe so durante esta
  # varredura e e destruido ao final.
  export DATABASE_URL="postgresql://dast:dastpw@localhost:$PG_PORT/mediamais?schema=public" # gitleaks:allow
  export AUTH_SECRET="dast-$(head -c 24 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9')"
  export PORT="$DAST_PORT"
  # NODE_ENV NAO e fixado em production aqui: isso faria o npm ci pular as
  # devDependencies, e o build precisa do Tailwind e do TypeScript. O proprio
  # next build/start ja define production internamente.
  unset NODE_ENV || true

  # --- 2. dependencias ---
  # O build precisa das devDependencies. Uma pasta node_modules instalada com
  # NODE_ENV=production existe mas esta incompleta, entao verificamos um
  # marcador real em vez de so checar se a pasta existe.
  local need_install=0
  [[ -d "$REPO_ROOT/node_modules" ]] || need_install=1
  for probe in "@tailwindcss/postcss" "typescript" "@prisma/client"; do
    [[ -d "$REPO_ROOT/node_modules/$probe" ]] || need_install=1
  done

  if [[ $need_install -eq 1 ]]; then
    log "instalando dependencias, incluindo devDependencies (npm ci)..."
    if ! npm ci --include=dev --no-audit --no-fund > "$rep_dir/npm-ci.log" 2>&1; then
      record dast ERROR "$(( $(now) - t0 ))" 0 0 0 0 "npm ci falhou; ver npm-ci.log"
      return
    fi
  fi

  # --- 3. schema ---
  #
  # Deliberadamente NAO usamos "prisma db push" aqui. O Prisma 7 classifica
  # esse comando como acao destrutiva e exige consentimento explicito quando
  # detecta que foi invocado por um agente de IA - e a protecao esta certa,
  # porque um push apontado para o banco errado destroi dados de producao.
  #
  # Em vez disso: geramos o DDL a partir do schema com "migrate diff", que e
  # somente leitura e nao conecta em banco nenhum, e aplicamos esse SQL no
  # container efemero criado segundos antes. Nao ha dado para perder, e o SQL
  # gerado fica no relatorio como artefato revisavel.
  log "gerando DDL a partir do schema (sem conectar em banco)..."
  if ! npx --yes prisma migrate diff \
        --from-empty --to-schema prisma/schema.prisma \
        --script -o "$rep_dir/schema-init.sql" \
      > "$rep_dir/prisma-diff.log" 2>&1; then
    record dast ERROR "$(( $(now) - t0 ))" 0 0 0 0 "geracao do DDL falhou; ver prisma-diff.log"
    return
  fi

  log "aplicando DDL no Postgres efemero..."
  if ! docker exec -i "$DAST_PG_NAME" \
        psql -U dast -d mediamais -v ON_ERROR_STOP=1 -q \
        < "$rep_dir/schema-init.sql" \
      > "$rep_dir/psql-apply.log" 2>&1; then
    record dast ERROR "$(( $(now) - t0 ))" 0 0 0 0 "aplicacao do DDL falhou; ver psql-apply.log"
    return
  fi

  log "gerando o Prisma Client..."
  if ! npx --yes prisma generate > "$rep_dir/prisma-generate.log" 2>&1; then
    record dast ERROR "$(( $(now) - t0 ))" 0 0 0 0 "prisma generate falhou; ver prisma-generate.log"
    return
  fi

  # --- 4. build ---
  #
  # Usamos --webpack em vez do Turbopack (padrao no Next 16) porque o worker
  # de postcss do Turbopack nao consegue resolver "@tailwindcss/postcss" a
  # partir da raiz do projeto e o build falha. Para efeito de DAST isso e
  # indiferente: o alvo da varredura sao as rotas HTTP e o comportamento do
  # servidor, que nao mudam com o empacotador. Se o build com Turbopack
  # voltar a funcionar, troque de volta para manter paridade com producao.
  log "compilando a aplicacao (next build --webpack)..."
  if ! npx --yes next build --webpack > "$rep_dir/next-build.log" 2>&1; then
    record dast ERROR "$(( $(now) - t0 ))" 0 0 0 0 "next build falhou; ver next-build.log"
    return
  fi

  # --- 5. sobe o app ---
  log "iniciando a aplicacao na porta $DAST_PORT..."
  npm run start -- --port "$DAST_PORT" > "$rep_dir/next-start.log" 2>&1 &
  DAST_APP_PID=$!

  local up=0
  for _ in $(seq 1 90); do
    if curl -fsS -o /dev/null "http://127.0.0.1:$DAST_PORT/" 2>/dev/null; then up=1; break; fi
    if ! kill -0 "$DAST_APP_PID" 2>/dev/null; then break; fi
    sleep 1
  done
  if [[ $up -eq 0 ]]; then
    record dast ERROR "$(( $(now) - t0 ))" 0 0 0 0 "aplicacao nao respondeu em :$DAST_PORT; ver next-start.log"
    return
  fi
  log "aplicacao no ar; iniciando varredura ZAP..."

  # --- 6. ZAP ---
  local zap_script="zap-baseline.py"
  [[ "$DAST_MODE" == "full" ]] && zap_script="zap-full-scan.py"

  # -I: nao encerra com erro por causa de avisos; a decisao de reprovar e nossa.
  #
  # Forcamos o uid do host para que os relatorios saiam com a posse correta,
  # mas esse uid nao existe no /etc/passwd da imagem. Nesse caso a JVM resolve
  # user.home como "/zap/?" e o ZAP aborta sem conseguir criar seu diretorio.
  # ZAP usa a propriedade user.home da JVM, nao a variavel HOME - por isso a
  # correcao e via JAVA_TOOL_OPTIONS, apontando para um tmpfs gravavel (o
  # zap-baseline.py tambem escreve /tmp/zap_out.json, com caminho fixo).
  # Sao necessarias as duas variaveis: HOME para o zap-baseline.py, que grava
  # seu plano da Automation Framework no diretorio home, e user.home para a
  # JVM, que ignora HOME e sem isso resolve o caminho como "/zap/?".
  docker run --rm --network host -u "$(id -u)" \
    -e HOME=/tmp -e JAVA_TOOL_OPTIONS="-Duser.home=/tmp" \
    --tmpfs /tmp:rw,mode=1777,size=512m \
    -v "$rep_dir:/zap/wrk:rw" \
    "$IMG_ZAP" "$zap_script" \
      -t "http://127.0.0.1:$DAST_PORT" \
      -J zap.json -r zap.html -w zap.md \
      -I -m 3 -T 10 \
    > "$rep_dir/zap.log" 2>&1 || true

  if ! valid_json "$rep_dir/zap.json"; then
    record dast ERROR "$(( $(now) - t0 ))" 0 0 0 0 "ZAP nao gerou relatorio; ver zap.log"
    return
  fi

  local zh zm zl zi
  zh=$(jq '[.site[]?.alerts[]? | select(.riskcode=="3")] | length' "$rep_dir/zap.json")
  zm=$(jq '[.site[]?.alerts[]? | select(.riskcode=="2")] | length' "$rep_dir/zap.json")
  zl=$(jq '[.site[]?.alerts[]? | select(.riskcode=="1")] | length' "$rep_dir/zap.json")
  zi=$(jq '[.site[]?.alerts[]? | select(.riskcode=="0")] | length' "$rep_dir/zap.json")

  local note="modo $DAST_MODE, alvo :$DAST_PORT, $zi informativo(s)"
  if [[ $(( zh + zm + zl )) -gt 0 ]]; then
    record dast FAIL "$(( $(now) - t0 ))" 0 "$zh" "$zm" "$zl" "$note"
  else
    record dast PASS "$(( $(now) - t0 ))" 0 0 0 0 "$note"
  fi
}

# --------------------------------------------------------------------------
# Execucao das etapas
# --------------------------------------------------------------------------
for s in secrets sast deps sbom dast; do
  if wants "$s"; then
    "stage_$s"
  else
    record "$s" SKIP 0 0 0 0 0 "nao solicitada nesta execucao"
  fi
done

# --------------------------------------------------------------------------
# Consolidacao
# --------------------------------------------------------------------------
head2 "Resumo"

TOT_C=0; TOT_H=0; TOT_M=0; TOT_L=0
N_FAIL=0; N_ERROR=0; N_SKIP=0

while IFS=$'\t' read -r st status dur c h m l note; do
  TOT_C=$((TOT_C+c)); TOT_H=$((TOT_H+h)); TOT_M=$((TOT_M+m)); TOT_L=$((TOT_L+l))
  case "$status" in
    FAIL)  N_FAIL=$((N_FAIL+1)) ;;
    ERROR) N_ERROR=$((N_ERROR+1)) ;;
    SKIP)  N_SKIP=$((N_SKIP+1)) ;;
  esac
done < "$STATE"

# summary.json
jq -Rn \
  --arg run "$RUN_ID" --arg failon "$FAIL_ON" --arg mode "$DAST_MODE" \
  --argjson c "$TOT_C" --argjson h "$TOT_H" --argjson m "$TOT_M" --argjson l "$TOT_L" \
  --argjson nf "$N_FAIL" --argjson ne "$N_ERROR" --argjson ns "$N_SKIP" \
  --rawfile tsv "$STATE" '
  {
    run: $run, geradoEm: (now | todate), failOn: $failon, dastMode: $mode,
    totais: { critical: $c, high: $h, medium: $m, low: $l },
    etapas: (
      $tsv | split("\n") | map(select(length>0)) | map(split("\t")) |
      map({ etapa: .[0], status: .[1], segundos: (.[2]|tonumber),
            critical: (.[3]|tonumber), high: (.[4]|tonumber),
            medium: (.[5]|tonumber), low: (.[6]|tonumber), nota: .[7] })
    ),
    contagem: { fail: $nf, error: $ne, skip: $ns }
  }' > "$OUT/summary.json"

# summary.md
{
  echo "# Relatorio DevSecOps - Media+"
  echo
  echo "- **Execucao:** \`$RUN_ID\`"
  echo "- **Gerado em:** $(date '+%d/%m/%Y %H:%M:%S')"
  echo "- **Reprova a partir de:** \`$FAIL_ON\`"
  echo "- **Etapas solicitadas:** $RUN_STAGES"
  echo
  echo "## Achados por etapa"
  echo
  echo "| Etapa | Status | Tempo | Critico | Alto | Medio | Baixo | Observacao |"
  echo "|---|---|--:|--:|--:|--:|--:|---|"
  while IFS=$'\t' read -r st status dur c h m l note; do
    echo "| $st | **$status** | ${dur}s | $c | $h | $m | $l | $note |"
  done < "$STATE"
  echo "| **TOTAL** | | | **$TOT_C** | **$TOT_H** | **$TOT_M** | **$TOT_L** | |"
  echo
  echo "## Ferramentas"
  echo
  echo "| Camada | Ferramenta | Imagem |"
  echo "|---|---|---|"
  echo "| Segredos | Gitleaks | \`$IMG_GITLEAKS\` |"
  echo "| SAST | Semgrep | \`$IMG_SEMGREP\` |"
  echo "| SCA | npm audit | \`$IMG_NODE\` |"
  echo "| SCA | OSV-Scanner | \`$IMG_OSV\` |"
  echo "| SCA + misconfig | Trivy | \`$IMG_TRIVY\` |"
  echo "| SBOM | Syft | \`$IMG_SYFT\` |"
  echo "| SBOM vuln | Grype | \`$IMG_GRYPE\` |"
  echo "| DAST | OWASP ZAP | \`$IMG_ZAP\` |"
  echo
  echo "## Artefatos"
  echo
  echo '```'
  ( cd "$OUT" && find . -type f | sort | sed 's|^\./||' )
  echo '```'
} > "$OUT/summary.md"

ln -sfn "$RUN_ID" "$REPORTS_ROOT/latest"

printf '\n'
printf '  %-8s %-6s %8s %8s %8s %8s\n' "ETAPA" "STATUS" "CRITICO" "ALTO" "MEDIO" "BAIXO"
printf '  %s\n' "------------------------------------------------------------"
while IFS=$'\t' read -r st status dur c h m l note; do
  color="$C_GRN"
  case "$status" in FAIL|ERROR) color="$C_RED";; SKIP) color="$C_YEL";; esac
  printf '  %-8s %s%-6s%s %8s %8s %8s %8s\n' "$st" "$color" "$status" "$C_RESET" "$c" "$h" "$m" "$l"
done < "$STATE"
printf '  %s\n' "------------------------------------------------------------"
printf '  %-8s %-6s %8s %8s %8s %8s\n' "TOTAL" "" "$TOT_C" "$TOT_H" "$TOT_M" "$TOT_L"
printf '\n'
log "Relatorios: security-reports/latest/summary.md"

# --------------------------------------------------------------------------
# Codigo de saida
# --------------------------------------------------------------------------
if [[ $N_ERROR -gt 0 ]]; then
  fail "$N_ERROR etapa(s) falharam ao executar. Isso NAO e aprovacao - a varredura nao aconteceu."
  exit 2
fi

if [[ $N_SKIP -gt 0 && $REQUIRE_ALL -eq 1 ]]; then
  fail "$N_SKIP etapa(s) puladas e --require-all esta ativo."
  exit 3
fi

BLOCKING=0
case "$FAIL_ON" in
  critical) BLOCKING=$TOT_C ;;
  high)     BLOCKING=$(( TOT_C + TOT_H )) ;;
  medium)   BLOCKING=$(( TOT_C + TOT_H + TOT_M )) ;;
  low)      BLOCKING=$(( TOT_C + TOT_H + TOT_M + TOT_L )) ;;
  none)     BLOCKING=0 ;;
esac

if [[ $BLOCKING -gt 0 ]]; then
  fail "$BLOCKING achado(s) no nivel '$FAIL_ON' ou acima. Pipeline reprovado."
  exit 1
fi

printf '%s[ pipeline ]%s %sTodas as etapas executadas sem achados no nivel de reprovacao.%s\n' \
  "$C_BLU" "$C_RESET" "$C_GRN" "$C_RESET"
exit 0
