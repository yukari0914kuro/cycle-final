const bottle = document.getElementById("bottle");
const box = document.getElementById("box");

let isFlying = false;

// PCのクリックとスマホのタップをまとめて扱う
bottle.addEventListener("pointerup", throwBottle);

function throwBottle() {
    // アニメーション中の連打を防ぐ
    if (isFlying) {
        return;
    }

    isFlying = true;

    // 投げるアニメーションの長さ
    const duration = 1500;
    const startTime = performance.now();

    /*
        ボトルとボックスの現在位置を取得する。
        画面サイズが変わっても、
        ボックスへ向かって飛ぶようにする。
    */
    const bottleRect = bottle.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    // ボトルの中心座標
    const bottleCenterX =
        bottleRect.left + bottleRect.width / 2;

    const bottleCenterY =
        bottleRect.top + bottleRect.height / 2;

    // ボックスの投入口付近の座標
    const boxCenterX =
        boxRect.left + boxRect.width / 2;

    const boxCenterY =
        boxRect.top + boxRect.height * 0.22;

    // ボックスまでの移動距離
    const targetX =
        boxCenterX - bottleCenterX;

    const targetY =
        boxCenterY - bottleCenterY;

    function animate(currentTime) {
        const elapsed =
            currentTime - startTime;

        /*
            progressは開始時に0、
            終了時に1になる。
        */
        const progress =
            Math.min(elapsed / duration, 1);

        /*
            62％まではボックスより手前。
            62％を超えたらボックスの奥へ移る。
        */
        if (progress < 0.62) {
            bottle.style.zIndex = "3";
        } else {
            bottle.style.zIndex = "1";
        }

        // 滑らかに減速する
        const eased =
            easeOutCubic(progress);

        /*
            投げた軌道の高さ。
            数字を大きくすると高く浮く。
        */
        const arcHeight = -110;

        // 放物線
        const arc =
            4 *
            arcHeight *
            progress *
            (1 - progress);

        // ボックスへ向かう座標
        const x =
            targetX * eased;

        const y =
            targetY * eased + arc;

        /*
            手前から奥へ小さくする。
            最終サイズは元の55％。
        */
        const startScale = 1;
        const endScale = 0.55;

        const scale =
            startScale +
            (endScale - startScale) * eased;

        // 全体で100度回転
        const rotation =
            100 * eased;

        /*
            最後の22％で透明にする。
        */
        let opacity = 1;

        if (progress > 0.78) {
            opacity =
                1 -
                (progress - 0.78) / 0.22;
        }

        // 毎フレーム、位置・回転・大きさ・透明度を更新
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
            finishAnimation();
        }
    }

    requestAnimationFrame(animate);
}

function finishAnimation() {
    bottle.style.opacity = "0";
    bottle.style.zIndex = "1";

    console.log("ペットボトルが回収されました");

    /*
        Render上のPythonサーバーへ
        「1回回収された」と送る。
    */
    sendRecycleEvent();

    /*
        0.6秒待ってから、
        新しいボトルを上から出す。
    */
    setTimeout(() => {
        const appearDuration = 700;
        const appearStartTime = performance.now();

        // 初期位置より160px上から出現
        const startY = -160;

        bottle.style.zIndex = "3";
        bottle.style.opacity = "0";

        function appear(currentTime) {
            const elapsed =
                currentTime - appearStartTime;

            const progress =
                Math.min(
                    elapsed / appearDuration,
                    1
                );

            // 最後に向かって滑らかに減速
            const eased =
                easeOutCubic(progress);

            // 上から初期位置へ降りてくる
            const y =
                startY * (1 - eased);

            bottle.style.transform = `
                translate(-50%, -50%)
                translateY(${y}px)
                rotate(0deg)
                scale(1)
            `;

            // 降りながら透明度0から1へ
            bottle.style.opacity = eased;

            if (progress < 1) {
                requestAnimationFrame(appear);
            } else {
                // 初期状態へ完全に戻す
                bottle.style.transform =
                    "translate(-50%, -50%)";

                bottle.style.opacity = "1";
                bottle.style.zIndex = "3";

                // 再びタップ可能にする
                isFlying = false;
            }
        }

        requestAnimationFrame(appear);
    }, 600);
}

/*
    RenderのPythonサーバーへ
    回収情報を送る関数。
*/
async function sendRecycleEvent() {
    try {
        const response = await fetch(
            "https://recycle-server-bfed.onrender.com/recycle",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    value: 1
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `送信に失敗しました: ${response.status}`
            );
        }

        const data =
            await response.json();

        console.log(
            "現在の回収数:",
            data.count
        );
    } catch (error) {
        /*
            通信失敗でもアニメーション自体は止めない。
        */
        console.error(
            "回収情報を送れませんでした:",
            error
        );
    }
}

/*
    最初は速く、
    終わりに向かって滑らかに減速する。
*/
function easeOutCubic(value) {
    return 1 -
        Math.pow(1 - value, 3);
}
