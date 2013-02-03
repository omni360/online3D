﻿/*****
Converts Vertex array  to Three.js mesh and adds it to a scene
Dependency async.js
**/
function VertexToMesh() {

    var getTrianglesCountInPacket = function (vertexCount) {
        if (vertexCount >= 100000)
            return 3000;
        else if (vertexCount >= 40000)
            return 1500;
        else if (vertexCount >= 10000)
            return 1200;

        return 1;
    }


    /** Loads mesh (object) and accepts nect call (callback) procedure **/
    this.loadAsync = function (scene, object, progressCallback, finishCallback) {

        var _scene = scene;
        var _finishCallback = finishCallback || function () { };
        var _progressCallback = progressCallback || function () { };
        var _this = this;
        var done = false;

        var geometry = new THREE.Geometry();
        var modelColor = object.Color;
        var vertices = object.Vertices;
        var i = 0;
        var allVerticesCount = vertices.length;


        //single step runner
        var readStep = function (iterator) {
            //just define a step of 1/1000 of the quantity of triangles in the mesh
            var index = parseInt(getTrianglesCountInPacket(allVerticesCount));
            var verticesCount = 0;

            if (i === allVerticesCount) {
                done = true;
            }
            else {

                while (index > 0 && i < allVerticesCount) {

                    geometry.vertices.push(new THREE.Vector3(vertices[i].x, vertices[i].y, vertices[i].z));
                    verticesCount++;

                    //this is triangle, so create a new face
                    if (verticesCount == 3) {
                        var length = geometry.vertices.length;
                        var face = new THREE.Face3(length - 3, length - 2, length - 1, 1);
                        face.color.setHex(modelColor);
                        geometry.faces.push(face);
                        verticesCount = 0;
                    }

                    index--;
                    i++;
                }
            }

            iterator();
        }
        //----



        //Check if loading done 
        var isLoadingDone = function () {
            _progressCallback(i, allVerticesCount); //run progress if defined
            return done;
        }
        // ----


        //Run on complete
        var complete = function () {
            //vertices are loaded 
            if (geometry.vertices.length > 0) {

                //consruct mesh
                var meshMaterial = new THREE.MeshPhongMaterial({ ambient: 0x222222, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, perPixel: false, overdraw: true });
                var meshWireframe = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true });
                var multiMaterial = [meshMaterial, meshWireframe];

                //normals calculation for correct lighting
                geometry.computeFaceNormals();
                geometry.computeVertexNormals();

                geometry.__dirtyColors = true;
                var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, multiMaterial);

                //set additional mesh data
                mesh.name = object.ModelName;
                mesh.facecount = geometry.faces.length;
                mesh.verticescount = geometry.vertices.length;
                mesh.filesize = object.Size;
                mesh.color = modelColor;
                _scene.add(mesh); //add to scene


                _finishCallback();

            }
        }
        // ------ 


        async.until(isLoadingDone, readStep, complete);

    }
}