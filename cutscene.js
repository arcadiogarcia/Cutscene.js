var Cutscene = (function () {

    var cutscene = {};

    var animationEngine;

    var scenes = {};

    var currentScene = [];

    var time = 0;

    var t_delta = 0;

    var intervalHolder = null;

    var callback;

    var objects;

    var positionFunctions;

    cutscene.setAnimationEngine = function (engine) {
        animationEngine = engine;
    }

    cutscene.getAnimationEngine = function () {
        return animationEngine;
    }

    cutscene.playScene = function (name, fps, callback_func) {
        if (intervalHolder != null) {
            window.clearInterval(intervalHolder);
        }
        callback = callback_func;
        t_delta = Math.round(1000 / fps);
        currentScene = scenes[name].map(function (x) { return x; });
        positionFunctions = [];
        objects = {};
        animationEngine.clear();
        animationEngine.setCamera(0, 0);
        intervalHolder = window.setInterval(loop, t_delta);
    }

    cutscene.loadScenes = function (url, callback) {
        var xmlhttp = new XMLHttpRequest;

        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                parse(xmlhttp.responseXML);
                callback();
            }
        }
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }


    function parse(xml) {
        for (var i = 0; i < xml.getElementsByTagName("scene").length; i++) {
            var sceneXML = xml.getElementsByTagName("scene")[i];
            var scene = [];
            for (var j = 0; j < sceneXML.getElementsByTagName("keyframe").length; j++) {
                var keyframe = {};
                var keyframeXML = sceneXML.getElementsByTagName("keyframe")[j];
                var possibleValues = ["t", "command", "spritesheet", "x", "y", "z", "static", "name", "state", "fx", "fy", "fz"];
                possibleValues.forEach(function (x) {
                    if (keyframeXML.getAttributeNode(x)) {
                        keyframe[x] = keyframeXML.getAttributeNode(x).value;
                    }
                });
                scene.push(keyframe);
            }
            scenes[sceneXML.getAttributeNode("name").value] = scene;
        }
    }

    function loop() {
        if (currentScene.length == 0) {
            window.clearInterval(intervalHolder);
            intervalHolder = null;
            callback();
        } else {
            var executeNow = currentScene.filter(function (x) { return x.t >= time && x.t < time + t_delta });
            executeNow.forEach(execute_command);
            positionFunctions.forEach(updatePosFunc);
            currentScene = currentScene.filter(function (x) { return x.t >= time + t_delta });
            time += t_delta;
        }
    }

    function updatePosFunc(x) {
        switch (x.dimension) {
            case "x":
                animationEngine.setX(objects[x.name], x.func(time - x.t));
                break;
            case "y":
                animationEngine.setY(objects[x.name], x.func(time - x.t));
                break;
            case "z":
                animationEngine.setZindex(objects[x.name], x.func(time - x.t));
                break;
        }
    }

    function execute_command(command) {
        if (command.fx || command.fy || command.fz) {
            if (command.fx) {
                var func = new Function("t", "return " + command.fx);
                positionFunctions = positionFunctions.filter(function (x) { return !(x.name == command.name && x.dimension == "x"); });
                positionFunctions.push({ name: command.name, dimension: "x", func: func, t: command.t });
            }
            if (command.fy) {
                var func = new Function("t", "return " + command.fy);
                positionFunctions = positionFunctions.filter(function (x) { return !(x.name == command.name && x.dimension == "y"); });
                positionFunctions.push({ name: command.name, dimension: "y", func: func, t: command.t });
            }
            if (command.fz) {
                var func = new Function("t", "return " + command.fz);
                positionFunctions = positionFunctions.filter(function (x) { return !(x.name == command.name && x.dimension == "z"); });
                positionFunctions.push({ name: command.name, dimension: "z", func: func, t: command.t });
            }
        }
        switch (command.command) {
            case "spawn":
                objects[command.name] = animationEngine.addObject(command.spritesheet, undefined, +command.x, +command.y, +command.z, command.static || false);
                break;
            case "position":
                if (command.x) {
                    animationEngine.setX(objects[command.name], +command.x);
                    positionFunctions = positionFunctions.filter(function (x) { return !(x.name == command.name && x.dimension == "x"); });
                }
                if (command.y) {
                    animationEngine.setY(objects[command.name], +command.y);
                    positionFunctions = positionFunctions.filter(function (x) { return !(x.name == command.name && x.dimension == "y"); });
                }
                if (command.z) {
                    animationEngine.setZindex(objects[command.name], +command.z);
                    positionFunctions = positionFunctions.filter(function (x) { return !(x.name == command.name && x.dimension == "z"); });
                }
                break;
            case "state":
                animationEngine.setState(objects[command.name], command.state);
                break;
            case "destroy":
                positionFunctions = positionFunctions.filter(function (x) { return !(x.name == command.name); });
                animationEngine.deleteObject(objects[command.name]);
                break;
            case "camera":
                var camera = animationEngine.getCamera();
                animationEngine.setCamera(+command.x || camera.x, +command.y || camera.y);
                break;
        }
    }

    return cutscene;
});