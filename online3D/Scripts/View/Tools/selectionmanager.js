﻿TOOLS.SelectionManager = function () {


    var _this = this;
    var regionSelectionStarted = false;
   
    var currentMeshName = "";
    var lastSegmentMesh;
    var region = [];
    var normalsVisible = false;
    var thereIsSomethingSelected = false;

    this.start = function () {
        console.log("No agent call for " + this.title + " expected");
    };

    this.startAgent = function () {
        console.log("Start " + this.title + " agent");

        lastAddedNotePoint = undefined;
       
        document.addEventListener('mouseup', onMouseUp, false);
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('keydown',  onKeyDown, false);

     
    };


    var clearSelections = function () {

        TOOLS.clearSelection();
        thereIsSomethingSelected = false;
    }


    var deleteSelectedFaces = function () {

        if (thereIsSomethingSelected) {
            TOOLS.deleteSelectedFaces();
            thereIsSomethingSelected = false;
        }
    }

    var getFaceCenterOfGravity = function(face, vertices) {
        
        var v0 = vertices[face.a];
        var v1 = vertices[face.b];
        var v2 = vertices[face.c];

        return new THREE.Vector3((v0.x + v1.x + v2.x) / 3, (v0.y + v1.y + v2.y) / 3, (v0.z + v1.z + v2.z) / 3);        
    }

    var showHideNormals = function () {
        if (normalsVisible === false) {
            var normalLength = 0.2;
            var lineGeoFinal = new THREE.Geometry();
            var material = new THREE.LineBasicMaterial({
                color: 0x0000ff
            });



            TOOLS.forEachMesh(function (mesh) {
                var geo = mesh.children[0].geometry;
                geo.computeFaceNormals();


                var faces = geo.faces;             
                var vertices = geo.vertices;
               
                var step = 81;
                if (faces.length < 3) {
                    step = 1;
                }
                else if (faces.length <= 81) {
                    step = 3;
                }

                for (var i = 0; i < faces.length; i++) {

                    if (i % step === 0)
                        continue;

                    var face = faces[i];

                    var normal = face.normal;

                    var start = getFaceCenterOfGravity(face, vertices);
                   

                    var end = new THREE.Vector3();
                    end.copy(start);

                    end.addVectors(normal, start);

                    var lineGeo = new THREE.Geometry();
                    lineGeo.vertices.push(start);
                    lineGeo.vertices.push(end);

                    THREE.GeometryUtils.merge(lineGeoFinal, lineGeo);


                  

                }


            },
             function (mesh) {
                 return TOOLS.isComposedMesh(mesh);
             });


            var lineMesh = new THREE.Line(lineGeoFinal, material, THREE.LinePieces);
            lineMesh.normals = true;

            TOOLS.addMesh(lineMesh);
            normalsVisible = true;
        }
        else {
           
           
            TOOLS.forEachMesh(function (mesh) {
                TOOLS.removeMesh(mesh);
            }, function (mesh) {
                return mesh.normals !== undefined;
            });


            normalsVisible = false;
        }
    }


    this.stopAgent = function () {
        console.log("No stop call for " + this.title + " expected");

        document.removeEventListener('mouseup', onMouseUp, false);
        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('keydown', onKeyDown, false);

    };

    this.stop = function () {
        console.log("No stop call for " + this.title + " expected");
    };


    var surfaceSelection = function (meshName, fa) {
        var geodata = $.geoData;
        var selection = [];
        var investigateon = [fa];
        var unique = {};
        var trianglesLimit = 15000;
     
        var exclude = {};

        var angleTollerance = 0.5;
        var acceptableAngle =  Math.PI / 2 - angleTollerance;

        while (investigateon.length > 0 && selection.length < trianglesLimit) {
            var temp = [];

            var exclude = {};

            for(var f=0; f<investigateon.length; f++) { //iterate over collection 

                var face = investigateon[f]; //get face

                var keyF = geodata.getFaceKey(face);               
             
                var startFaceNormal = face.normal || geodata.computeFaceNormal(meshName, face);

                var vertices = geodata.getVerticesOfFace(meshName, face); //get vertices of face

                if (vertices === undefined)
                    continue;

                for (var v = 0; v < vertices.length; v++) {     //for each vertex get its neigbour faces
                    var vertex = vertices[v];
                    var neighbours = geodata.getNeigbourFaces(meshName, vertex, 1);
                    for (var n = 0; n < neighbours.length; n++) {
                        var neighbourFace = neighbours[n];

                        var keyFace = geodata.getFaceKey(neighbourFace);
                        if (unique[keyFace] === "")
                            continue;

                        if (exclude[keyFace] === "")
                            continue;

                        if (neighbourFace.normal.angleTo(startFaceNormal) < acceptableAngle) {
                            temp.push(neighbourFace);
                            selection.push(neighbourFace);
                        }
                        else {
                            exclude[keyFace] = "";
                        }                  

                        unique[keyFace] = "";
                    }
                }

                unique[keyF] = "";
            }

            investigateon = []; //clear collection 
            investigateon = investigateon.concat(temp); //add new neigbours, if any
        }


        thereIsSomethingSelected = (selection.length > 0);

        TOOLS.selectFaces(selection);
        TOOLS.updateAllGeometries(true); 

    }

    var getCursorPosition3D = function (e) {
        return TOOLS.unprojectMouse(e);
    }
  
    var  getCursorPosition = function(e) {
        var x;
        var y;

        if (e.pageX != undefined && e.pageY != undefined) {
            x = e.pageX;
            y = e.pageY;
        } else {
            x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        return { xcoord: x, ycoord: y };
    }


    var resetCurrentDrawing = function () {
        region = [];
        TOOLS.removeMesh(lastSegmentMesh);
        regionSelectionStarted = false;

        //remove all previously added lines of region 
        var remove = [];
        TOOLS.forEachMesh(function (m) {
            remove.push(m);
        },
        function (m) {
            return m.region !== undefined;
        });

        for (var i = 0; i < remove.length; i++) {
            TOOLS.removeMesh(remove[i]);
        }
    }


    var isInsidePath = function (pointX, pointY, path) {
        
        var isInside = false;
        var pointsCount = path.length;

        var j = 0;
        for (var i = 0; i < pointsCount; i++)
        {
            j++;
            if (j == pointsCount)
                j = 0;

            if (path[i].y < pointY && path[j].y >= pointY || path[j].y < pointY && path[i].y >= pointY)
            {
                if (path[i].x + (pointY - path[i].y) / (path[j].y - path[i].y) * (path[j].x - path[i].x) < pointX)
                {
                    isInside = !isInside;
                }
            }
        }

        return isInside;
    }

    var getProjectedPoint = function (plane, start, direction) {

        var end = new THREE.Vector3(start.x, start.y, start.z); 
        end.addVectors(end, direction);

        return plane.intersectLine(start, end);
    }

  
    var drawTestLine = function (v0, v1, color) {


        var c = color || "#000000";

        var material = new THREE.LineBasicMaterial({
            color: c
        });


        var geo = new THREE.Geometry();
        geo.vertices.push(v0);
        geo.vertices.push(v1);

        TOOLS.addMesh(new THREE.Line(geo, material));
    }

    var makeSelection = function (event, region) {
        var suitableForSelection = [];
        
        var vectorView = TOOLS.getViewDirection(event).normalize();
        
        var cameraPosition = TOOLS.getCameraPosition();
        var plane = new THREE.Plane();



        //plane.setFromNormalAndCoplanarPoint(vectorView, vectorView);
        plane.setFromCoplanarPoints(region[0], region[1], region[2]);

        drawTestLine(cameraPosition, plane.normal);
      

        var geometries = [];
      

        var projectRegion = []; 
        for (var a = 0; a < region.length; a++) {
            var next = a + 1;
            if (next == region.length)
                next = 0;
            //var va = plane.projectPoint(region[a]);
            //var vnext = plane.orthoPoint(region[next]);
            //drawTestLine(va, vnext, "#FF0000");
            projectRegion.push(plane.coplanarPoint(region[a]));
        }

        TOOLS.forEachMesh(function (mesh) {
            var geo = mesh.children[0].geometry;
            var faces = geo.faces;
            var vertices = geo.vertices;
            var geometryNeedsUpdates = false; 
            for (var i = 0; i < faces.length; i++) {
                var face = faces[i];

                var vertexa = vertices[face.a];
                var vertexb = vertices[face.b];
                var vertexc = vertices[face.c];

                var vertexaP = plane.projectPoint(vertexa);
                var vertexbP = plane.projectPoint(vertexb);
                var vertexcP = plane.projectPoint(vertexc);
    

                drawTestLine(vertexaP, cameraPosition);

                //var vertexaP = getProjectedPoint(plane, vertexa, vectorView);
                //var vertexbP = getProjectedPoint(plane, vertexb, vectorView);
                //var vertexcP = getProjectedPoint(plane, vertexc, vectorView);

            
                //var aInside = isInsidePath(vertexaP.x, vertexaP.y, region);
                //var bInside = isInsidePath(vertexbP.x, vertexbP.y, region);
                //var cInside = isInsidePath(vertexcP.x, vertexcP.y, region);

                var aInside = isInsidePath(vertexaP.x, vertexaP.y, projectRegion);
                var bInside = isInsidePath(vertexbP.x, vertexbP.y, projectRegion);
                var cInside = isInsidePath(vertexcP.x, vertexcP.y, projectRegion);

                if (aInside && bInside && cInside) {
                    suitableForSelection.push(face);
                    geometryNeedsUpdates = true;
                }
            }

            if (geometryNeedsUpdates) {
                geometries.push(geo);
            }
            
        },
        function (mesh) {
            return TOOLS.isComposedMesh(mesh);
        });

        TOOLS.selectFaces(suitableForSelection);
        TOOLS.updateAllGeometries();

    }

    var isRegionClosed = function (region) {
        if (region.length < 2)
            return false;

        var lastPoint = region[region.length - 1];
        var firstPoint = region[0];

        return (lastPoint.distanceTo(firstPoint) < 0.05);

    }
   
    var drawSegment = function (v0, v1) {

        var material = new THREE.LineBasicMaterial({
            color: 0x0000ff
        });


        var geo = new THREE.Geometry();
        geo.vertices.push(v0);
        geo.vertices.push(v1);

        var line = new THREE.Line(geo, material);
        line.region = true;
        TOOLS.addMesh(line); 

        return line;
    }

    var drawLastSegment = function (event) {
        TOOLS.removeMesh(lastSegmentMesh);

        var curPos = getCursorPosition3D(event);      
        var lastPos= region[region.length - 1]; 

        lastSegmentMesh = drawSegment(lastPos, curPos);
    }

    var onMouseUp = function (event) {


        if (event === undefined) return;


        //do not accept clisk that are not directly made on CANVAS itself

        if (!utils.isElementClicked(event, "canvas"))
            return;
        
       
        //if there is another tool in execution or is not LEFT button pressed, do not do anything 
        if (event.button !== 0 || event.ctrlKey || TOOLS.current !== undefined) {
            resetCurrentDrawing();
            return;
        };

    

        var intersection = TOOLS.getIntersectionFromMouseCoord(event);

        //there is an intersection so make a surface selection 
        if (intersection !== undefined) {

            regionSelectionStarted = false;
            //var name = intersection.object.name; 
            //if(name === "") 
            var name = intersection.object.parent.name;

            surfaceSelection(name, intersection.face);
        }
        else {

            //no region selection available
            return;


            regionSelectionStarted = true;
            var pos = getCursorPosition3D(event);
            //conitnue constructing region
            region.push(pos);

            //region was closed 
            if (isRegionClosed(region)) {
                makeSelection(event, region);
                resetCurrentDrawing();
            }
            else {              

                //there is more then one point, so accpet last available segment as a part of region
                if (region.length > 1) {
                    //accept last availble segment 
                    drawSegment(region[region.length - 2], region[region.length - 1]);
                }
            }
        }
    };


    var keyDownHandler = {
        27: function () { //ESC
            clearSelections();
        },
        46: function () { //DELETE 
            deleteSelectedFaces(); 
        },
        78: function () { //N
            showHideNormals();
        }

    }


    var onKeyDown = function (event) {

        //do not accept clisk that are not directly made on body of document itself
        if (!utils.isElementClicked(event, "body"))
            return;       

        var keycode = event.which;
        var func = keyDownHandler[keycode];
        if(func) func();
    }

    var onMouseMove = function (event) {
        if (event === undefined) return;
        if (event.button !== 0) return;        
        if (!regionSelectionStarted) return;
        if (event.altKey || event.ctrlKey || event.shiftKey) return;
        

        drawLastSegment(event);
    };

}


//Notes manager
TOOLS.SelectionManager.prototype = TOOLS;
TOOLS.SelectionManager.prototype.constructor = TOOLS.Tool(TOOLS.SELECTION);