const btnNode = document.querySelector('.btn');

function btnClick() {

  alert(`Разрешение экрана: ${window.screen.width}x${window.screen.height}`)
}

btnNode.addEventListener('click', btnClick);

