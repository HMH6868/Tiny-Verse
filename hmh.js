const { HttpsProxyAgent } = require('https-proxy-agent');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const colors = require('colors');
const readline = require('readline');
const UserAgent = require('user-agents');
const printLogo = require('./source/logo');

// Đọc file config
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// Đọc danh sách proxy từ file
const proxyFile = path.join(__dirname, 'proxy.txt');
const dataFile = path.join(__dirname, 'data.txt');

const proxies = fs.readFileSync(proxyFile, 'utf8').replace(/\r/g, '').split('\n').filter(Boolean);
const data = fs.readFileSync(dataFile, 'utf8').replace(/\r/g, '').split('\n').filter(Boolean);


const REQUEST_HEADERS = {
  "Accept": "*/*",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
  "Connection": "keep-alive",
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  "Origin": "https://app.tonverse.app",
  "Referer": "https://app.tonverse.app/",
  "Sec-Ch-Ua": "\"Chromium\";v=\"134\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": "\"Windows\"",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  "X-Application-Version": "0.9.10",
  "X-Requested-With": "XMLHttpRequest"
};

async function checkProxyIP(proxy) {
  try {
    const proxyAgent = new HttpsProxyAgent(proxy);
    const response = await axios.get('https://api.ipify.org?format=json', {
      httpsAgent: proxyAgent,
      timeout: 3000 
    });
    if (response.status === 200) {
      return response.data.ip;
    } else {
      throw new Error(`Không thể kiểm tra IP của proxy. Status code: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Error khi kiểm tra IP của proxy: ${error.message}`.red);
  }
}

async function checkAllProxies() {
  console.log(`Kiểm tra ${proxies.length} proxy...`);
  for (let i = 0; i < proxies.length; i++) {
    try {
      const ip = await checkProxyIP(proxies[i]);
      console.log(`Proxy ${i+1}/${proxies.length} (${proxies[i]}) hoạt động. IP: ${ip}`.green);
    } catch (error) {
      console.log(`Proxy ${i+1}/${proxies.length} (${proxies[i]}) không hoạt động: ${error.message}`.red);
    }
  }
}

async function postUserInfo(proxy, session, userAgent) {
  try {
    const body = new URLSearchParams({
      session: session,
      id: "undefined"
    }).toString();

    const proxyAgent = new HttpsProxyAgent(proxy);
    
    const response = await axios.post(
      "https://api.tonverse.app/user/info",
      body,
      {
        httpsAgent: proxyAgent,
        headers: {
          ...REQUEST_HEADERS,
          "User-Agent": userAgent
        }
      }
    );

    console.log(`Tài khoản: ${response.data.response.first_name}`.green + ` - ` + `Số dư: ${response.data.response.dust}`.red);
    return response.data;
  } catch (error) {
    console.error(`[${proxy}] Đã xảy ra lỗi:`, error.message);
    return null;
  }
}

async function colectCoin(proxy, session, userAgent) {
  try {
    const body = new URLSearchParams({
      session: session
    }).toString();

    const proxyAgent = new HttpsProxyAgent(proxy);
    
    const response = await axios.post(
      "https://api.tonverse.app/galaxy/collect",
      body,
      {
        httpsAgent: proxyAgent,
        headers: {
          ...REQUEST_HEADERS,
          "User-Agent": userAgent
        }
      }
    );

    if(response.data.response.success == 1){
      console.log(`Đã thu thập coin thành công với ${response.data.response.dust}`.green);
    }else{
      console.log(`Không thu thập được coin`.red);
    }
    return response.data;
  } catch (error) {
    console.error(`[${proxy}] Đã xảy ra lỗi:`, error.message);
    return null;
  }
}

async function getId(proxy, session, userAgent) {
  try {
    const body = new URLSearchParams({
      session: session
    }).toString();
    const proxyAgent = new HttpsProxyAgent(proxy);

    const response = await axios.post(
          "https://api.tonverse.app/galaxy/get",
          body,
          {
            httpsAgent: proxyAgent,
            headers: {
              ...REQUEST_HEADERS,
              "User-Agent": userAgent
            }
          }
        )

    console.log(`Đã lấy id sao thành công với id: ${response.data.response.id}`.yellow);
    return response.data.response.id ;
  }
  catch (error) {
    console.error("xảy ra lỗi khi lấy id sao");
  }
}

async function creatStar(proxy, session, userAgent, id) {
  try {
    const body = new URLSearchParams({
      session: session,
      galaxy_id: id,
      stars: 100
    }).toString();
    const proxyAgent = new HttpsProxyAgent(proxy);

    const response = await axios.post(
      "https://api.tonverse.app/stars/create",
      body,
      {
        httpsAgent: proxyAgent,
        headers: {
         ...REQUEST_HEADERS,
          "User-Agent": userAgent
        }
      }
    )
    if(response.data.response.success == 1){
      console.log(`Đã tạo sao thành công`.green);
    }else{
      console.log(`Không tạo được sao`.red);
    }
  }
  catch (error) {
    console.error("xảy ra lỗi khi tạo sao");
  }
}


async function countdown(minutes) {
  const totalSeconds = minutes * 60;
  let remainingSeconds = totalSeconds;
  
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      remainingSeconds--;
      
      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      
      // Xóa dòng trước đó và in lại thời gian còn lại
      process.stdout.write(`\rChờ ${mins}:${secs < 10 ? '0' + secs : secs} trước khi chạy lại...`);
      
      if (remainingSeconds <= 0) {
        clearInterval(timer);
        process.stdout.write('\n');
        console.log('Bắt đầu chạy lại chương trình...'.green);
        resolve();
      }
    }, 1000);
  });
}


async function main() {
  // Kiểm tra xem số lượng proxy và data có tương ứng không
  const minCount = Math.min(proxies.length, data.length);
  
  const randomDelay = Math.floor(Math.random() * 4000); 
  
  if (minCount === 0) {
    console.error("Không có proxy hoặc data nào để xử lý.");
    return;
  }

  printLogo();

  console.log(`Đang xử lý ${minCount} cặp proxy và session...`);
  
  for (let i = 0; i < minCount; i++) {
    const proxy = proxies[i];
    const session = data[i];
    
    console.log(`Xử lý cặp ${i+1}/${minCount}: Proxy=${proxy}, Session=${session.substring(0, 15)}...`);
    
    try {
      const ip = await checkProxyIP(proxy);
      console.log(`Proxy hoạt động. IP: ${ip}`.green);
      
      // Tạo User-Agent mới cho mỗi cặp proxy-session
      const randomUserAgent = new UserAgent().toString();
      console.log(`User-Agent được sử dụng: ${randomUserAgent}`.cyan);
      
      await postUserInfo(proxy, session, randomUserAgent);
      

      await new Promise(resolve => setTimeout(resolve, randomDelay));

      await colectCoin(proxy, session, randomUserAgent);

      await new Promise(resolve => setTimeout(resolve, randomDelay));

      if(config.createStar == true){
        const getIdSao = await getId(proxy, session, randomUserAgent);

        await new Promise(resolve => setTimeout(resolve, randomDelay));
        
        await creatStar(proxy, session, randomUserAgent, getIdSao);
      }
      console.log('==============================================')
    } catch (error) {
      console.error(`Không thể sử dụng proxy ${proxy}: ${error.message}`);
    }
  }
  
  console.log("Hoàn thành xử lý tất cả cặp proxy và session.");
}


async function runProgram() {
  while (true) {
    await main();
    console.log(`\nChờ ${config.countdownMinutes} phút trước khi chạy lại...`.yellow);
    await countdown(config.countdownMinutes);
  }
}


runProgram();
