const SPEED_SCALE = 0.00001;

const game = document.querySelector("#game");
const scoreDisplay = document.querySelector("#score");
const oldScore = document.querySelector(".score.old");
const startMessage = document.querySelector("#start-message");
const backDrop = document.querySelector("#backdrop");
const gameoverMessage = document.querySelector("#gameover-message");

document.addEventListener("click", startGame, { once: true });
document.addEventListener("keydown", startGame, { once: true });

var audioElement0 = document.createElement('audio');
audioElement0.setAttribute('src', 'assets/Run.mp3');
audioElement0.setAttribute('autoplay', 'autoplay');




function loope(element) {
  element.currentTime = 0;
  element.play();
}



/* general variables */
let lastTime;
let speedScale;
let score;

/* frame update */
function update(time) {
  if (lastTime == null) {
    lastTime = time;
    window.requestAnimationFrame(update);
    return;
  }

  const delta = time - lastTime;

  updateGround(delta, speedScale);
  updateDino(delta, speedScale);
  updateCactus(delta, speedScale);
  updateSpeedScale(delta);
  updateScore(delta);

  if (checkGameOver()) return handleGameOver();

  lastTime = time;
  window.requestAnimationFrame(update);
}

function startGame() {
  lastTime = null;
  speedScale = 1;
  score = 0;
  setupGround();
  setupDino();
  audioElement0.addEventListener('ended', loope(audioElement0), false);
  setupCactus();
  startMessage.classList.add("hide");
  gameoverMessage.classList.add("hide");
  backDrop.classList.add("hide");
  window.requestAnimationFrame(update);
}

/* speeds up the game over time */
function updateSpeedScale(delta) {
  speedScale += delta * SPEED_SCALE;
}

function updateScore(delta) {
  score += delta * 0.01;
  scoreDisplay.textContent = Math.floor(score);

}

/* collision conditions */
function checkCollision(rect1, rect2) {
  return (
    rect1.left + 30 < rect2.right &&
    rect1.top + 30 < rect2.bottom &&
    rect1.right > rect2.left + 30 &&
    rect1.bottom > rect2.top
  );
}

function checkGameOver() {
  const dinoRect = getDinoRect();
  return getCactusRects().some(rect => checkCollision(rect, dinoRect)); /* check collision with any of the cactus */
}

function handleGameOver() {
  setDinoLose();
  setTimeout(() => {
    document.addEventListener("keydown", startGame, { once: true }); 
    document.addEventListener("click", startGame, { once: true });/* prevents accidental click */
    gameoverMessage.classList.remove("hide");
 /*    audioElement0.pause() */
    backDrop.classList.remove("hide");
    oldScore.textContent = Math.floor(score)
  }, 100);
}




/* HANDLING CSS PROPERTIES */

/* get property value */
function getCustomProperty(elem, prop) {
  return parseFloat(getComputedStyle(elem).getPropertyValue(prop)) || 0;
}

/* set property value */
function setCustomProperty(elem, prop, value) {
  elem.style.setProperty(prop, value);
}

/* increment the property value */
function incrementCustomProperty(elem, prop, inc) {
  setCustomProperty(elem, prop, getCustomProperty(elem, prop) + inc);
}


/* GROUND MOVEMENT */

const GROUND_SPEED = 0.036;
const grounds = document.querySelectorAll(".ground");

function setupGround() {
  setCustomProperty(grounds[0], "--left", 0);
  setCustomProperty(grounds[1], "--left", 300);
}

function updateGround(delta, speedScale) {
  grounds.forEach(ground => {
    incrementCustomProperty(ground, "--left", delta * speedScale * GROUND_SPEED * -1); /* moves the ground according to game speed */

    if (getCustomProperty(ground, "--left") <= -300) {
      incrementCustomProperty(ground, "--left", 600); /* loop the elements */
    }
  });
}

/* DINOSAUR MOVEMENT */

const dino = document.querySelector("#dino");
const JUMP_SPEED = 0.43;
const GRAVITY = 0.0016;
const DINO_FRAME_COUNT = 2;
const FRAME_TIME = 100;

let isJumping;
let dinoFrame;
let currentFrameTime;
let yVelocity;

function setupDino() {
  isJumping = false;
  dinoFrame = 0;
  currentFrameTime = 0;
  yVelocity = 0;

  setCustomProperty(dino, "--bottom", 0);
  document.removeEventListener("keydown", onJump);
   /* reset the dinosaur if the player dies while jumping */
   
    document.addEventListener("keydown", onJump);
   

}

function updateDino(delta, speedScale) {
  handleRun(delta, speedScale);
  handleJump(delta);
}

function getDinoRect() {
  return dino.getBoundingClientRect(); /* get the dinosaur hitbox */
}

function setDinoLose() {
  dino.src = "assets/ch-1.png";
}

function handleRun(delta, speedScale) {
  if (isJumping) {
    dino.src = `assets/ch-0.png`;
    document.removeEventListener("click", onJump);
    document.removeEventListener("keydown", onJump);
    return;
  }

  if (currentFrameTime >= FRAME_TIME) {
    dinoFrame = (dinoFrame + 1) % DINO_FRAME_COUNT;
    dino.src = `assets/ch-${dinoFrame}.png`; /* switch between images to simulate movement */
    currentFrameTime -= FRAME_TIME;
    document.addEventListener("click", onJump);
    document.addEventListener("keydown", onJump);
  }
  currentFrameTime += delta * speedScale;
}

function handleJump(delta) {
  if (!isJumping) return;

  incrementCustomProperty(dino, "--bottom", yVelocity * delta);

  if (getCustomProperty(dino, "--bottom") <= 0) {
    setCustomProperty(dino, "--bottom", 0);
    isJumping = false;
  }

  yVelocity -= GRAVITY * delta;
}

function onJump(e) {
 /* if (isJumping) {
 document.removeEventListener("keydown", onJump);
  }
  */
  yVelocity = JUMP_SPEED;
  isJumping = true;
}

/* ADD CACTUS */

const CACTUS_SPEED = 0.036;
const CACTUS_INTERVAL_MIN = 1000;
const CACTUS_INTERVAL_MAX = 2000;

let nextCactusTime;

function setupCactus() {
  nextCactusTime = CACTUS_INTERVAL_MIN;
  document.querySelectorAll(".cactus").forEach(cactus => {
    cactus.remove(); /* remove cactus when game restart */
  })
}

function updateCactus(delta, speedScale) {
  document.querySelectorAll(".cactus").forEach(cactus => {
    incrementCustomProperty(cactus, "--left", delta * speedScale * CACTUS_SPEED * -1);
    if (getCustomProperty(cactus, "--left") <= -100) {
      cactus.remove(); /* remove cactus off screen so it doesn't impair game performance */
    }
  })

  if (nextCactusTime <= 0) {
    createCactus();
    nextCactusTime =
      randomizer(CACTUS_INTERVAL_MIN, CACTUS_INTERVAL_MAX) / speedScale;
  }
  nextCactusTime -= delta;
}

function getCactusRects() {
  return [...document.querySelectorAll(".cactus")].map(cactus => {
    return cactus.getBoundingClientRect(); /* get the hitbox of all the cactus on the screen */
  })
}

function createCactus() {
  let index = Math.floor(Math.random() * 5);

  const cactus = document.createElement("img");
  cactus.src = `assets/cactus-${index}.png`;

  cactus.classList.add("cactus");
  if (index === 4) {
    cactus.classList.add("sm");
  }
  if (index === 3) {
    cactus.classList.add("lg");
  }
  setCustomProperty(cactus, "--left", 200);
  game.append(cactus);

}

function randomizer(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min); /* choose a number between minimum and maximum */
}



// Get the cloud container element
const cloudContainer = document.querySelector('.cloud-container');

// Create a function to generate a random number between min and max

// Create a function to create a new cloud element
function createCloud(directon) {
  // Create a new image element for the cloud
  const cloudImg = document.createElement('img');
  cloudImg.classList.add('cloud');
  const cloudImages = ['cloud1.png', 'cloud2.png', 'cloud3.png'];
  const randomIndex = Math.floor(Math.random() * cloudImages.length);
  const cloudImageUrl = cloudImages[randomIndex];
  cloudImg.src = `assets/${cloudImageUrl}`;

  if (directon === 1) {
    const leftPosition = randomizer(-500, -100);
    cloudImg.style.left = leftPosition + 'px';
  } else {
    const leftPosition = randomizer(-500, -100);
    cloudImg.style.right = leftPosition + 'px';
  }


  // Add the cloud element to the cloud container
  cloudContainer.appendChild(cloudImg);

  // Animate the cloud element using the cloudMove keyframes
  if (directon === 1) {
    cloudImg.animate([
      { left: '100%' },
      { left: '-200px' }
    ], {
      duration: 20000, // 20 seconds
      easing: 'linear',
      iterations: Infinity
    });
  }
  else {
    cloudImg.animate([
      { left: '-200px' },
      { left: '100%' }
    ], {
      duration: 30000, // 20 seconds
      easing: 'linear',
      iterations: Infinity
    });
  }
  if (directon === 1) {
    setTimeout(() => {
      cloudContainer.removeChild(cloudImg);
    }, 20000);
  }
   else {
    setTimeout(() => {
      cloudContainer.removeChild(cloudImg);
    }, 30000);
   }
 
}
createCloud(1);
setInterval(() => {
  createCloud(1);

}, randomizer(7000, 8000));
setInterval(() => {
  createCloud(3);

}, randomizer(8000, 10000));