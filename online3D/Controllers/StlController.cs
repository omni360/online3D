﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using ModelViewer3D.Helpers;
using online3D.Models;
using MongoDB.Bson.Serialization;
using online3D.Helpers;
using System.Drawing;


namespace ModelViewer3D.Controllers
{
    [Layout("StlLayout")]
    public class StlController : Controller
    {

       

        /// <summary>
        /// Default view
        /// </summary>
        /// <returns></returns>
        public ActionResult StlView()
        {
            return View("StlView");
        }


        private string GetUserName()
        {
            string userName = User.Identity.Name;
            if (string.IsNullOrEmpty(userName))
                userName = "sample";

            return userName;
        }

        /// <summary>
        /// Loads STL view and sets to bag the complete HTTP path to the model, that
        /// sequentially will be loaded after vis ajax call.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        public ActionResult LoadModel(string id)
        {
            try
            {
                             MongoDataAccess access = new MongoDataAccess();
                var models = access.ReadModelCollection(id, false);
                ViewBag.ID = models.First().ID;
            }
            catch(Exception ex)
            {
                return Json(false, JsonRequestBehavior.AllowGet);
            }

            return StlView();
        }


     

        /// <summary>
        /// Saves model in the base
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]     
        [Authorize]
        public ActionResult SaveModel(ModelInfo model)
        {           
           
            model.User = User.Identity.Name;

            //generate unique link for the model 
            if (string.IsNullOrEmpty(model.ID))
            {
                model.ID = LinkGenerator.GenerateTempLink(model, HttpContext.Request);
            }

            var savedCount = VerticesHolder.AddModel(model);
            if (savedCount == model.VertexCount)
            {
                IData access = new MongoDataAccess();
                model.Vertices = VerticesHolder.GetVertices(model);
                model.ModelImage = VerticesHolder.GetImageData(model);
                bool saveResult = access.SaveModel(model);
                VerticesHolder.RemoveVerticesData(model);
                VerticesHolder.RemoveImageData(model);

                if (!saveResult)
                    return Json(false);
            }

            return Json(model.ID);
        }


        ///// <summary>
        ///// Handles account log IN and OUT calls and redirects them to Account controller
        ///// </summary>
        ///// <param name="action"></param>
        ///// <returns></returns>
        //[HttpGet]
        //public ActionResult Account(string action)
        //{
        //    if (action == "LogOut")
        //    {
        //        return RedirectToAction("LogOut", "Account");
        //    }

        //    return new EmptyResult();
        //}

        /// <summary>
        /// Gets a preview for psecified ID model
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        public JsonResult GetSavedModelPreview(string id)
        {
            try
            {               

                MongoDataAccess access = new MongoDataAccess();
                if (id == "first")//first model of first collection was requested
                {
                    var models = access.ReadModelCollection(0, false);
                    if (models != null)
                        return Json(models.First(), JsonRequestBehavior.AllowGet);
                    else
                        return Json(false);
                }
                else
                {
                    var userName = GetUserName();                   
                    var models = access.ReadModelCollection(id, false).Where(m => m.User == userName);                    
                    return Json(models.First(), JsonRequestBehavior.AllowGet);
                }

               
            }
            catch (Exception ex)
            {
                LogEntry.logger.ErrorException("Exception in GetSavedModelPreview", ex);
                return Json(false,JsonRequestBehavior.AllowGet);
            }
           
        }

        /// <summary>
        /// Get user's saved models
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Authorize]
        public JsonResult GetSavedModels()
        {
            var username = User.Identity.Name;
            if (string.IsNullOrEmpty(username))
                return Json(false);
            MongoDataAccess access = new MongoDataAccess();

            try
            {
                var models = access.ReadUserModelCollection(username);
                return Json(models, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(false,JsonRequestBehavior.AllowGet);
            }
        }


        /// <summary>
        /// Get specified model's packet
        /// </summary>
        /// <param name="id"></param>
        /// <param name="modelIndex"></param>
        /// <param name="packetIndex"></param>
        /// <returns></returns>
        [HttpGet]
        public JsonResult GetModels(string id, int modelIndex, int packetIndex)
        {
            try
            {
                MongoDataAccess access = new MongoDataAccess();

                var collectionID = id.Split('/').Last();
                var models = access.ReadModelCollection(collectionID, true, modelIndex);

                if (models.Count() == 0)
                    return Json("alldone", JsonRequestBehavior.AllowGet); //signal, there is nothing more to load. All done

                var model = models.FirstOrDefault();
                var tempList = new List<Vertex>();

                var verticesCount = model.Vertices.Count();
                var tempModel = model.LightClone();
                var step = (int)(verticesCount / 27);

                var start = packetIndex * step;
                var end = (packetIndex * step) + step;

                if (start >= verticesCount)
                    return Json("modeldone", JsonRequestBehavior.AllowGet); //signal, we finish with model

                //tempModel.Vertices = model.Vertices.Skip(start).Take(end);
                for (int i = start; i < end; i++)
                {
                    if (i >= verticesCount)
                        break;

                    tempList.Add(model.Vertices.ElementAt(i));
                }

                tempModel.Vertices = tempList;

                return Json(tempModel, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                LogEntry.logger.ErrorException("Error on loading " + id + " model: " + modelIndex + " packetIndex: " + packetIndex,
                                            ex);
                return Json(false, JsonRequestBehavior.AllowGet);
            }
        }



    }


}


