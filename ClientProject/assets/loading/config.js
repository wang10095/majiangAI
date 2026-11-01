
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
    gameGlobal.Config = {};
    gameGlobal.AllExcelSheets = {"collect_cfg": "95ee6bf2080e7708", "difficult_cfg": "2b72d04f13afa897", "globals_cfg": "ec9420d13ea90d53", "item_cfg": "1c96a3bef82e21bd", "language_cfg": "7a6fc1e3946f3aad", "stage_cfg": "e92151e123930f27"};
    gameGlobal.configVersion = 1000;
    }
    