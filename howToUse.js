var spritesheetInstance; //An instance of spritesheet.js
var sceneUrl; //The url to the XML file describing the cutscene
var sceneName; //One of the scenes described in the file
var fps; //The frames per second at which the animation should be played

var cutscene = Cutscene();
cutscene.setAnimationEngine(spritesheetInstance);
cutscene.loadScenes(sceneUrl, function () {
      console.log("Cutscene loaded");
      cutscene.playScene(sceneName, fps, function () {
            console.log("Cutscene ended");
      });
});