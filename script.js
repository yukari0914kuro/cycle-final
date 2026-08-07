const bottle = document.getElementById("bottle");
const box = document.getElementById("box");

let isFlying = false;

bottle.addEventListener("click", throwBottle);
bottle.addEventListener("touchend", (event) => {
    event.preventDefault();
    throwBottle();
});

function throwBottle() {
    // 連打防止
    if (isFlying) return;

    isFlying = true;

    const duration = 1500;
    const startTime = performance.now();

    /*
        リサイクルボックスの位置を取得する。
        スマホの画面サイズが変わっても、
        ボックスの場所へ飛ぶようにするため。
    */
    const bottleRect = bottle.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    const bottleCenterX =
        bottleRect.left + bottleRect.width / 2;

    const bottleCenterY =
        bottleRect.top + bottleRect.height / 2;

    const boxCenterX =
        boxRect.left + boxRect.width / 2;

    const boxCenterY =
        boxRect.top + boxRect.height * 0.35;

    const targetX = boxCenterX - bottleCenterX;
    const targetY = boxCenterY - bottleCenterY;

    function animate(currentTime) {
        const elapsed = currentTime - startTime;

        // 0から1まで進む値
        const progress = Math.min(elapsed / duration, 1);

        /*
            滑らかな減速。
            AEでいうイージングに近いもの。
        */
        const eased = easeOutCubic(progress);

        /*
            最初に少し上へ投げる。
            後半に向かって、その浮き上がりがなくなる。
        */
        const arcHeight = -110;
        const arc =
            4 * arcHeight * progress * (1 - progress);

        // ボックスの方向へ移動
        const x = targetX * eased;
        const y = targetY * eased + arc;

        // 手前から奥へ小さくする
        const startScale = 1;
        const endScale = 0.55;

        const scale =
            startScale +
            (endScale - startScale) * eased;

        // 回転は約100度
        const rotation = 100 * eased;

        // 最後の25％で透明にする
        let opacity = 1;

        if (progress > 0.75) {
            opacity = 1 - (progress - 0.75) / 0.25;
        }

        bottle.style.transform = `
            translate(-50%, -50%)
            translate(${x}px, ${y}px)
            rotate(${rotation}deg)
            scale(${scale})
        `;

        bottle.style.opacity = opacity;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            bottle.style.opacity = "0";

            console.log("ペットボトルが回収されました");

            /*
                後でPythonへ情報を送る場所。

                fetch("http://PCのIPアドレス:5000/recycle", {
                    method: "POST"
                });
            */
        }
    }

    requestAnimationFrame(animate);
}

function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
}