﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using ModelViewer3D.Helpers;
using online3D.Helpers;
using online3D.Models;
using online3D.Controllers;

namespace ModelViewer3D.Controllers
{
  //  [Layout("_Layout")] 

   
    public class IntroController : BaseController
    {      
        public ActionResult Start()
        {
            return View("IntroView");
        }

    }
}
