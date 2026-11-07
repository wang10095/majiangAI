{
        let gameGlobal;
        try {
            if (GameGlobal) {
                gameGlobal = GameGlobal;
            }
        } catch (e) {}
        try {
            if (!gameGlobal) {
                gameGlobal = window;
            }
        } catch (e) {
            console.error('未能找到全局根对象！');
        }

        gameGlobal.gameServerUrl = "";// 默认正式服
        gameGlobal.gameVersion = "1.0.3";
        gameGlobal.gameBuildTime = "02171149";
        gameGlobal.getGameGlobal = () => gameGlobal;
    }