//Cloud function 배포 : deploy.ps1 (index.js 의 app이 진입점)
//로컬 실행 : nodemon server.js (server.js)

require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { SessionsClient } = require('@google-cloud/dialogflow');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Dialogflow 통신처리 1
const keyFilename = path.join(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS); // 서비스 계정 키 파일 경로
const sessionClient = new SessionsClient({ keyFilename }); // Dialogflow 세션 클라이언트 생성

// Dialogflow 통신처리 2
const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const sessionId = process.env.DIALOGFLOW_SESSION_ID;
const languageCode = process.env.DIALOGFLOW_LANGUAGE_CODE;

// Dialogflow fulfillment처리. JSON 데이터를 파싱하기 위한 미들웨어
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// serving
app.use(express.static(path.join(__dirname, 'public'))); // 'public' 디렉토리의 정적 파일 서빙
app.get('/', (req, res) => { // index.html 서빙
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 로컬 서버 실행
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`http://localhost:${PORT} 서버 실행중`);
    });
}

// 클라우드 서버 진입점
module.exports = app; 

// EJS 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// /accepted 경로 설정
app.get('/accepted', async (req, res) => {
    try {
        const orders = await Order.find({});
        res.render('accepted', { orders });
    } catch (err) {
        console.error('Error retrieving orders:', err);
        res.status(500).send('Error retrieving orders');
    }
});


///////////////////////////////////////////////////////////////////////////////////////////////////////////
// 1. mongodb 연결 mongoose
const mongoURI = 'mongodb+srv://jiho9380:wlgh@cluster0.gq0icjx.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0'; // MongoDB URI 설정

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB 연결 성공'))
    .catch(err => console.log('MongoDB 연결 실패', err));


const Schema = mongoose.Schema;

const orderSchema = new mongoose.Schema({
    beverage: String,
    temperature: String,
    quantity: Number,
    orderNumber: Number
});

const Order = mongoose.model('Order', orderSchema, 'orders');

// const testOrder = new Order({ temperature: '아이스', beverage: '바닐라라떼', quantity: 2, orderNumber: Date.now() });
// testOrder.save()
//     .then(() => console.log('테스트 주문 삽입 성공'))
//     .catch(err => console.error('테스트 주문 삽입 실패', err));



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 2. Dialogflow와의 통신을 처리하는 엔드포인트 (최종)
app.post('/dialogflow', async (req, res) => {
    const { message } = req.body; // 클라이언트로부터 받은 메시지
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
    
    // Dialogflow 요청 설정
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: message,
                languageCode: languageCode,
            },
        },
    };

    try {
        // Dialogflow에 메시지 전송 및 응답 받기
        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;
        // 응답을 클라이언트에게 전송
        res.json({ reply: result.fulfillmentText });
    } catch (error) {
        // 오류 처리
        console.error('Dialogflow 요청 중 오류 발생:', error);
        res.status(500).send('Dialogflow 요청 중 오류가 발생했습니다.');
    }
});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
3. // Dialogflow Fulfillment 엔드포인트 (ver1)
// node.js와 express로 웹훅서버 설정하는 방식 
app.post('/webhook', async (req, res) => {
    console.log("Webhook POST 요청 수신");
    const intentName = req.body.queryResult.intent.displayName;
    const parameters = req.body.queryResult.parameters;

    if (intentName === 'test') {
        console.log("test1 webhook 연결 완료");
        const response = { fulfillmentText: 'test1 webhook 연결 완료' };
        res.json(response);
    } else if (intentName === 'test2') {
        const testEntityValue = parameters.testentity;

        // const newOrder = new Order({ item: testEntityValue, test: 'test', orderNumber: Date.now() });
        // newOrder.save()
        //     .then(() => console.log('테스트 주문 삽입 성공'))
        //     .catch(err => console.error('테스트 주문 삽입 실패', err));

        // res.json({ fulfillmentText: `Received testentity: ${testEntityValue}` });
    }
}

);
