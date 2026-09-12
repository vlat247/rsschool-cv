const timeElement = document.querySelector("#almaty-time");

const updateAstanaTime = () => {
  const now = new Date();
  const formattedTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Almaty",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  timeElement.textContent = `${formattedTime}, GMT +5`;
  timeElement.dateTime = now.toISOString();
};

updateAstanaTime();
window.setInterval(updateAstanaTime, 30000);
