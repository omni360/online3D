﻿TOOLS.MeshPencil = function () {

    var _this = this;


    var hexToRgba = function (hex) {
        var c = hex;
        var r = (c & (0xff << 24)) >>> 24;
        var g = (c & (0xff << 16)) >>> 16;
        var b = (c & (0xff << 8)) >>> 8;
        var a = (c & 0xff) / 0xff;
        return 'rgba(' + [r, g, b, a].join(',') + ')';
    };

    this.color = 0xffee99; //default selection color
    this.title = "Mesh pencil";
    this.text = "Choose a color and color mesh with mouse.";
    this.htmlUI = //"<div class='well'>" + 
			        "<div class='input-append color' data-color='" + hexToRgba(this.color) + "'  id='cpcolor'>" +
				        "<input type='text' class='span2' value='' readonly=''>" +
				        "<span class='add-on' style='cursor:pointer;'><i style='background-color:" + hexToRgba(this.color) + ";'></i></span>" +
			        "</div>";
    //"</div>";

    this.uiWidth = 300;


    this.start = function () {
        console.log("Start mesh pencil");
        document.addEventListener('mousemove', onMouseMove, false);
        TOOLS.current = _this;

        $('#cpcolor').colorpicker().on('changeColor', function (ev) {
            _this.color = ev.color.toHex();
        });


    };



    this.stop = function () {
        console.log("Stop mesh pencil");
        document.removeEventListener('mousemove', onMouseMove, false);
    };


    var onMouseMove = function (event) {

        console.log(event.button);
        // if (event.button !== 0) {//left button
        var intersection = TOOLS.getIntersectionFromMouseCoord(event);
        if (intersection !== undefined) {
            intersection.face.color.setHex(_this.color);
            intersection.object.geometry.__dirtyColors = true;
        }
        // }
    };

}

//Point to point measurer
TOOLS.MeshPencil.prototype = {
    constructor: TOOLS.Tool(TOOLS.MESH_PENCIL)
};