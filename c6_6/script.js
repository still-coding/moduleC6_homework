// const wsUri = "wss://ws.postman-echo.com/raw";
const wsUri = "wss://echo-ws-service.herokuapp.com";

const MessageType = { SENT: "sent", RCVD: "recieved", GEO: "geo" };

const input = document.querySelector('.inp');
const btnGeo = document.querySelector('.btn-geo');
const btnSend = document.querySelector('.btn-send');
const chatbox = document.querySelector('.chatbox');
const statusDiv = document.querySelector('.status');

function displayStatus(message) {
  statusDiv.textContent = message
}


function displayMessage(message, type) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", type)
  msgDiv.textContent = message

  const senderDiv = document.createElement("div");
  senderDiv.classList.add("sender")
  switch(type) {
    case MessageType.SENT:
      senderDiv.textContent = "Вы:";
      break;
    case MessageType.RCVD:
      senderDiv.textContent = "Сервер:";
      break;
    case MessageType.GEO:
      senderDiv.textContent = "Геолокация:";
      msgDiv.textContent = "";
      msgDiv.appendChild(message);
      break;
  }
  msgDiv.prepend(senderDiv)
  const timeDiv = document.createElement("div");
  timeDiv.classList.add("time")
  const now = new Date()
  timeDiv.textContent = `${now.getHours()}:${now.getMinutes()}`
  msgDiv.appendChild(timeDiv)
  chatbox.appendChild(msgDiv)
  msgDiv.scrollIntoView({ behavior: "smooth", block: "end"});
}


function btnSendClick() {
  const message = input.value
  displayMessage(message, MessageType.SENT)
  websocket.send(message);
}


let websocket = new WebSocket(wsUri);
websocket.onopen = (evt) => {
  displayStatus(`Подключено к: ${evt.target.url}`)
};
websocket.onclose = (evt) => {
  displayStatus(`Отключено. Обновите страницу для подключения.`)
};
websocket.onmessage = (evt) => {
  // Первая попытка определить тип данных, приходящих в ответе
  // не увенчалась особым успехом - разные эхо серверы ведут себя по-разному.
  // Сервер postman просто закрывает сокет сразу, ка ктолько получает blob
  if (evt.data instanceof Blob)
  {
    console.log('blob detected')
    return;
  }
  // Эхо сервер heroku просто присылает обратно мой blob.text() в виде строки
  // и я придумал костыль - использовать property как флаг
  if (typeof(evt.data) === 'string')
  {
    const hacks = ['0xDEADBEEF', '0xdeadbeef', '3735928559']
    for (const h of hacks) {
      if (evt.data.includes('hack') && evt.data.includes(h))
      {
        return;
      }   
    }
    displayMessage(evt.data, MessageType.RCVD) 
  }
};

btnSend.addEventListener('click', btnSendClick)

const geoError = () => {
  displayStatus("Невозможно получить ваше местоположение")
}

const geoSuccess = (position) => {
  displayStatus("Местоположение определено")
  const mapLink = document.createElement('a');
  mapLink.href = `https://www.openstreetmap.org/#map=18/${position.coords.latitude}/${position.coords.longitude}`;
  mapLink.textContent = 'Геолокация';
  displayMessage(mapLink, MessageType.GEO)

  const json = JSON.stringify(
    {
      hack: 0xdeadbeef,
      time: position.timestamp,
      lat: position.coords.latitude,
      long: position.coords.longitude
    }
  )
  const blob = new Blob([json], { type: "application/json" });
  websocket.send(blob);
}

function btnGeoClick() {
  if (!navigator.geolocation) {
    displayStatus("Geolocation не поддерживается вашим браузером")
  } else {
    displayStatus("Определение местоположения...")
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
  }
}

btnGeo.addEventListener('click', btnGeoClick)

window.addEventListener('beforeunload', (evt) => {
  websocket.close();
  websocket = null;
  evt.returnValue = null;
});
