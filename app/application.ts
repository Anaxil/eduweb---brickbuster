class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(point: Point) {
        this.x += point.x;
        this.y += point.y;
    }
}

class Vector extends Point {
    flipX() {
        this.x *= -1;
    }

    flipY() {
        this.y *= -1;
    }
}

class Rect {
    topLeft: Point;
    bottomRight: Point;

    constructor(left: number, top: number, right: number, bottom: number) {
        this.topLeft = new Point(left, top);
        this.bottomRight = new Point(right, bottom);
    }

    add(point: Point) {
        this.topLeft.add(point);
        this.bottomRight.add(point);
    }

    clone(): Rect {
        return new Rect(this.topLeft.x, this.topLeft.y, this.bottomRight.x, this.bottomRight.y);
    }

    moveTo(rect: Rect) {
        this.topLeft.x = rect.topLeft.x;
        this.topLeft.y = rect.topLeft.y;
        this.bottomRight.x = rect.bottomRight.x;
        this.bottomRight.y = rect.bottomRight.y;
    }

    moveCenterXTo(centerX: number) {
        var left = centerX - this.width() / 2;
        var right = left + this.width();
        this.topLeft.x = left;
        this.bottomRight.x = right;
    }

    moveBottomTo(bottom: number) {
        this.topLeft.y = bottom - this.height();
        this.bottomRight.y = bottom;
    }

    width() {
        return this.bottomRight.x - this.topLeft.x;
    }

    height() {
        return this.bottomRight.y - this.topLeft.y;
    }

    centerX() {
        return (this.topLeft.x + this.bottomRight.x) / 2;
    }

    centerY() {
        return (this.topLeft.y + this.bottomRight.y) / 2;
    }

    moveLeft(step: number) {
        this.topLeft.x -= step;
        this.bottomRight.x -= step;
    }

    moveRight(step: number) {
        this.topLeft.x += step;
        this.bottomRight.x += step;
    }

}

enum Side {
    None,
    Left,
    Top,
    Right,
    Bottom
}


class Obstacle extends Rect {
    checkCollision(anotherRect: Rect): Side {
        var w = 0.5 * (this.width() + anotherRect.width());
        var h = 0.5 * (this.height() + anotherRect.height());
        var dx = this.centerX() - anotherRect.centerX();
        var dy = this.centerY() - anotherRect.centerY();

        if (Math.abs(dx) <= w && Math.abs(dy) <= h) {
            var wy = w * dy;
            var hx = h * dx;
            if (wy > hx) {
                return wy > -hx ? Side.Top : Side.Left;
            } else {
                return wy > -hx ? Side.Right : Side.Bottom
            }
        } else {
            return Side.None;
        }

        // return this.topLeft.x < anotherRect.bottomRight.x
        //         && this.bottomRight.x > anotherRect.topLeft.x
        //         && this.topLeft.y < anotherRect.bottomRight.y
        //         && this.bottomRight.y > anotherRect.topLeft.y ? Side.Left : Side.None;
    }
}

class Sprite extends Obstacle {
    sprite: HTMLElement;
    isVisible: Boolean;

    constructor(sprite: HTMLElement, left?: number, top?: number, right?: number, bottom?: number) {
        bottom = bottom || sprite.offsetTop + sprite.offsetHeight;
        right = right || sprite.offsetLeft + sprite.offsetWidth;
        top = top || sprite.offsetTop;
        left = left || sprite.offsetLeft;
        super(left, top, right, bottom)
        this.sprite = sprite;
        this.isVisible = true;
    }

    moveTo(rect: Rect) {
        super.moveTo(rect);

        // lub z dekompozycją
        let { x: posX, y: posY } = this.topLeft;

        this.sprite.style.left = posX + "px";
        this.sprite.style.top = posY + "px";
    }

    hide() {
        this.sprite.style.display = "none";
        this.isVisible = false;
    }

    show() {
        this.sprite.style.display = "";
        this.isVisible = true;
    }

    checkCollision(anotherRect: Rect): Side {
        if (!this.isVisible) {
            return Side.None;
        }
        return super.checkCollision(anotherRect);
    }
}

class Ball extends Sprite {
    radius: number;
    dir: Vector;
    sprite: HTMLElement;
    velocity: number;

    constructor(sprite: HTMLElement, dir: Vector) {
        /*
        get Radius nie działa 
        let radius  = parseInt(ballElement.style.borderRadius);
        powyższa metoda nie wszędzie działa, bo ten styl tutaj byłwyliczony
        */
        let radius: number = parseInt(getComputedStyle(sprite)["border-top-left-radius"]);
        super(sprite, sprite.offsetLeft, sprite.offsetTop, sprite.offsetLeft + 2 * radius, sprite.offsetTop + 2 * radius);
        
        this.radius = radius;
        this.dir = dir
        this.sprite = sprite;
        this.velocity = 5;
    }

    calculateNewPositon(): Rect {
        var newPosition = this.clone();
        newPosition.add(this.dir);
        return newPosition;
    }

    bounceHorizontal() {
        this.dir.flipY();
    }

    bounceVertical() {
        this.dir.flipX();
    }

    bounceWithAngle(angle: number) {
        angle = angle * (Math.PI / 180);
        this.dir.x = Math.cos(angle) * this.velocity;
        this.dir.y = -Math.sin(angle) * this.velocity;
    }

    moveLeft(step?: number) {
        var newPosition = this.clone();
        newPosition.moveLeft(step);
        this.moveTo(newPosition);

    }

    moveRight(step?: number) {
        var newPosition = this.clone();
        newPosition.moveRight(step);
        this.moveTo(newPosition);

    }

}

class Paddle extends Sprite {

    constructor(sprite: HTMLElement, public maxRight: number) {
        super(sprite);
    }

    moveLeft(step?: number) {
        var newPosition = this.clone();
        newPosition.moveLeft(step);

        if (newPosition.topLeft.x >= 0) {
            this.moveTo(newPosition);
        }
    }

    moveRight(step?: number) {
        var newPosition = this.clone();
        newPosition.moveRight(step);

        if (newPosition.bottomRight.x <= this.maxRight) {
            this.moveTo(newPosition);
        }
    }

    calculateHitAngle(ballX: number, ballRadius: number): number {
        var hitSpot = ballX - this.topLeft.x;
        var maxPaddle = this.width() + ballRadius;
        var minPaddle = -ballRadius;
        var paddleRange = maxPaddle - minPaddle;

        var minAngle = 160;
        var maxAngle = 20;
        var angleRange = maxAngle - minAngle;

        return ((hitSpot * angleRange) / paddleRange) + minAngle;
    }

}

class Brick extends Sprite {

}

// class HardBrick extends Brick {
//     durability: number;

//     constructor (durability: number) {
//         this.durability = durability;

//     }
// }

enum GameState {
    Running,
    GameOver,
    PreGame
}

enum KeyCodes {
    LEFT = 37,
    RIGHT = 39,
    START = 32
}

class Game {
    loopInterval: number = 10;
    gameState: GameState;
    ball: Ball;
    paddle: Paddle;
    bricks: Array<Brick> = [];

    keyMap = {};

    wallLeft: Obstacle;
    wallTop: Obstacle;
    wallRight: Obstacle;
    wallBottom: Obstacle;

    livesLeft: number;
    score: number;

    constructor(ballElement: HTMLElement, paddle: HTMLElement, bricks: HTMLCollection, boardElement: HTMLElement, public livesLabel: HTMLElement, public scoreLabel: HTMLElement, public newGameBtn: HTMLElement) {
        let startX: number = ballElement.offsetLeft;
        let startY: number = ballElement.offsetTop;

        this.gameState = GameState.PreGame;
        this.paddle = new Paddle(paddle, boardElement.offsetWidth);
        this.ball = new Ball(ballElement, new Vector(3, -3));
        this.score = 0;


        for (let i = 0; i < bricks.length; i++) {
            this.bricks.push(new Brick(<HTMLElement>bricks[i]));
        }

        this.createWalls(this.ball.radius, boardElement.offsetWidth, boardElement.offsetHeight);

        this.newGame();

        this.newGameBtn.addEventListener("click", () => this.newGame());
    }

    resetBricks() {
        for (let brick of this.bricks) {
            brick.show();
        }
    }

    newGame() {
        this.newGameBtn.style.display = "none";
        this.livesLeft = 3;
        this.livesLabel.innerText = "" + this.livesLeft;
        this.gameState = GameState.PreGame;
        this.ball.show();
        this.resetBricks();
        this.score = 0;
        this.scoreLabel.innerText = "" + this.score;
        this.ball.bounceWithAngle(60);
        var ballPosition = this.ball.clone();
        ballPosition.moveCenterXTo(this.paddle.centerX());
        ballPosition.moveBottomTo(this.paddle.topLeft.y - 4)
        this.ball.moveTo(ballPosition);
    }

    lostLive() {
        if (--this.livesLeft) {
            this.ball.bounceWithAngle(60);
            var ballPosition = this.ball.clone();
            ballPosition.moveCenterXTo(this.paddle.centerX());
            ballPosition.moveBottomTo(this.paddle.topLeft.y - 4)
            this.ball.moveTo(ballPosition);
            this.gameState = GameState.PreGame;
        } else {
            this.gameState = GameState.GameOver;
            this.ball.hide();
            this.newGameBtn.style.display = "block";
        }

        this.livesLabel.innerText = "" + this.livesLeft;
    }

    createWalls(radius: number, maxX: number, maxY: number) {
        this.wallLeft = new Obstacle(- radius, - radius, 0, maxY + radius);
        this.wallTop = new Obstacle(- radius, - radius, maxX + radius, 0);
        this.wallRight = new Obstacle(maxX, - radius, maxX + radius, maxY + radius);
        this.wallBottom = new Obstacle(- radius, maxY, maxX + radius, maxY + radius);
    }

    addListeners() {
        document.addEventListener("keyup", (e) => {
            this.keyMap[e.keyCode] = false;
        });

        document.addEventListener("keydown", (e) => {
            if (e.keyCode == KeyCodes.START) {
                this.gameState = GameState.Running;
            }
            this.keyMap[e.keyCode] = true;
        });
    }

    run() {

        this.addListeners();


        var running = setInterval(() => {

            if (this.gameState === 2) {
                if (this.keyMap[KeyCodes.LEFT]) {
                    this.paddle.moveLeft(5);
                    this.ball.moveLeft(5);
                }
                if (this.keyMap[KeyCodes.RIGHT]) {
                    this.paddle.moveRight(5);
                    this.ball.moveRight(5);
                }                
                return;
            } else {
                if (this.keyMap[KeyCodes.LEFT]) {
                    this.paddle.moveLeft(5);
                }
                if (this.keyMap[KeyCodes.RIGHT]) {
                    this.paddle.moveRight(5);
                }
                if (this.gameState !== GameState.Running) {
                    return;
                }

                var newBallPosition = this.ball.calculateNewPositon();



                if (this.wallBottom.checkCollision(newBallPosition)) {
                    this.lostLive();
                    return;

                }

                if (this.wallLeft.checkCollision(newBallPosition) || this.wallRight.checkCollision(newBallPosition)) {
                    this.ball.bounceVertical();
                }

                if (this.wallTop.checkCollision(newBallPosition)) {
                    this.ball.bounceHorizontal();
                }

                for (let brick of this.bricks) {
                    let wasHit = false;
                    switch (brick.checkCollision(newBallPosition)) {
                        case (Side.Left):
                        case (Side.Right):
                            this.ball.bounceVertical();
                            wasHit = true;
                            break;
                        case (Side.Top):
                        case (Side.Bottom):
                            this.ball.bounceHorizontal();
                            wasHit = true;
                    }

                    if (wasHit) {
                        this.score += 20;
                        this.scoreLabel.innerText = "" + this.score;
                        brick.hide();
                        break;
                    }
                }

                if (this.paddle.checkCollision(newBallPosition)) {
                    this.ball.bounceWithAngle(this.paddle.calculateHitAngle(this.ball.centerX(), this.ball.radius));
                }
                // switch (this.paddle.checkCollision(newBallPosition)) {
                //     case (Side.Left):
                //     case (Side.Right):
                //         this.ball.bounceVertical();
                //         break;
                //     case (Side.Top):
                //         this.ball.bounceHorizontal();
                //         break;
                // }

                this.ball.moveTo(this.ball.calculateNewPositon());

            }
        }, this.loopInterval);
    }
}

var ballElement: HTMLElement = <HTMLElement>document.getElementsByClassName("ball")[0];
var boardElement: HTMLElement = <HTMLElement>document.getElementsByClassName("game-board")[0];
var paddle: HTMLElement = <HTMLElement>document.getElementsByClassName("paddle")[0];
var bricks: HTMLCollection = <HTMLCollection>document.getElementsByClassName("brick");
var lives: HTMLElement = <HTMLElement>document.getElementById("lives");
var score: HTMLElement = <HTMLElement>document.getElementById("score");
var newGame: HTMLElement = <HTMLElement>document.getElementById("newGame");

var game = new Game(ballElement, paddle, bricks, boardElement, lives, score, newGame);

game.run();

console.log('Hello from BrickBuster !!!');
