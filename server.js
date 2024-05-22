//Cloud function 배포시 index.js 사용해 진입점 설정 (deploy.ps1)
//로컬 개발시에는 server.js 설정 (npm start)

require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { SessionsClient } = require('@google-cloud/dialogflow');
const { WebhookClient } = require('dialogflow-fulfillment');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Dialogflow 통신처리 1
const keyFilename = path.join(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS); // 서비스 계정 키 파일 경로
const sessionClient = new SessionsClient({ keyFilename }); // Dialogflow 세션 클라이언트 생성

// Dialogflow 통신처리
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
app.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ timestamp: -1 });
        res.render('orders', { orders });
    } catch (err) {
        console.error('주문 불러오기 중 오류 발생:', err);
        res.status(500).send('서버 오류');
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MongoDB 연결 설정


const mongoURI = 'mongodb+srv://jiho9380:wlgh@cluster0.gq0icjx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // MongoDB URI 설정
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB 연결 성공'))
    .catch(err => console.log('MongoDB 연결 실패', err));

// 메뉴 스키마 설정
const menuSchema = new mongoose.Schema({
    beverage: { type: String, required: true },
    temperature: { type: String, required: true },
    quantity: { type: Number, required: true }
});

// 주문 스키마 설정
const orderSchema = new mongoose.Schema({
    menu: { type: [menuSchema], required: true },
    timestamp: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Dialogflow와의 통신을 처리하는 엔드포인트
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
// Dialogflow Fulfillment 엔드포인트
app.post('/webhook', async (req, res) => {
    const intentName = req.body.queryResult.intent.displayName;

    if (intentName === 'test') {
        console.log("test 진입");
        const response = { fulfillmentText: '수정된 test Webhook 테스트인텐트 실행중' };
        res.json(response);
    } else if (intentName === '0001-order-beverage') {
        let parameters = req.body.queryResult.parameters;
        const responseText = '주문접수완료';
        const response = { fulfillmentText: responseText };
        res.json(response);




        // let beverage = parameters.beverage;
        // let quantity = parameters.quantity;
        // let temperature = parameters.temperature;

        // console.log("intent 진입");

        // // 주문 항목 생성
        // const menu = [{ beverage, temperature, quantity }];
        // const order = new Order({ menu });

    //     // MongoDB에 저장
    //     try {
    //         await order.save();
    //         res.json({ fulfillmentText: '주문이 성공적으로 저장되었습니다.' });
    //     } catch (err) {
    //         console.error('주문 저장 중 오류 발생:', err);
    //         res.json({ fulfillmentText: '주문 저장 중 오류가 발생했습니다. 다시 시도해주세요.' });
    //     }
     }

});



// 로컬 서버 실행
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`http://localhost:${PORT} 서버 실행중`);
    });
}

// 서버 시작 (진입점. Express 애플리케이션을 모듈로 내보냄)
module.exports = app;