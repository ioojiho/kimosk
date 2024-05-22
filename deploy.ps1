# Cloud Function 이름
$FUNCTION_NAME = "kimosk-webhook3"

# GCP 프로젝트 ID
$PROJECT_ID = "kimosk-xmvx"

# GCP 지역
$REGION = "asia-northeast3"

# 배포 명령어 실행
gcloud functions deploy $FUNCTION_NAME `
  --runtime nodejs18 `
  --trigger-http `
  --memory 256MB `
  --entry-point app `
  --region $REGION `
  --allow-unauthenticated `
  --source .