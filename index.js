//Cloud Functions가 올바르게 Express 앱을 로드할 수 있도록 index.js 파일을 생성하여 Express 앱을 등록

const functions = require('@google-cloud/functions-framework');
const app = require('./server'); // server.js를 가져옴



// HTTP 트리거로 함수를 설정
// functions.http 함수로 Express 애플리케이션을 Cloud Functions의 HTTP 트리거로 설정
// 여기서 'app'은 Cloud Functions 배포 시 --entry-point로 지정한 진입점 이름임.
functions.http('app', app);