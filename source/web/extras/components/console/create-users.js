/**
 * Copyright (C) 2010-2011 Share Extras contributors.
 *
 */

/**
* Extras root namespace.
* 
* @namespace Extras
*/
// Ensure Extras root object exists
if (typeof Extras == "undefined" || !Extras)
{
   var Extras = {};
}

/**
 * ConsoleCreateUsers tool component.
 * 
 * @namespace Extras
 * @class Extras.ConsoleCreateUsers
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
       Event = YAHOO.util.Event,
       Element = YAHOO.util.Element;
   
   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML;

   /**
    * ConsoleCreateUsers constructor.
    * 
    * @param {String} htmlId The HTML id of the parent element
    * @return {Extras.ConsoleCreateUsers} The new ConsoleCreateUsers instance
    * @constructor
    */
   Extras.ConsoleCreateUsers = function(htmlId)
   {
      this.name = "Extras.ConsoleCreateUsers";
      Extras.ConsoleCreateUsers.superclass.constructor.call(this, htmlId);
      
      /* Register this component */
      Alfresco.util.ComponentManager.register(this);

      /* Load YUI Components */
      Alfresco.util.YUILoaderHelper.require(["button", "container", "datasource", "datatable", "json", "history"], this.onComponentsLoaded, this);

      /* Define panel handlers */
      var parent = this;
      
      // NOTE: the panel registered first is considered the "default" view and is displayed first
      
      /* Search Panel Handler */
      FormPanelHandler = function FormPanelHandler_constructor()
      {
         FormPanelHandler.superclass.constructor.call(this, "form");
      };
      
      YAHOO.extend(FormPanelHandler, Alfresco.ConsolePanelHandler,
      {
         /**
          * PANEL LIFECYCLE CALLBACKS
          */
         
         /**
          * Called by the ConsolePanelHandler when this panel shall be loaded
          *
          * @method onLoad
          */
         onLoad: function onLoad()
         {
            // User data textarea
            parent.widgets.userData = Dom.get(parent.id + "-userdata");
            parent.widgets.dataType = Dom.get(parent.id + "-select-type");
            parent.widgets.sendEmail = Dom.get(parent.id + "-sendmail");
            parent.widgets.helpLink = Dom.get(parent.id + "-help-link");
            parent.widgets.helpText = Dom.get(parent.id + "-format-help");
            // Buttons
            parent.widgets.createButton = Alfresco.util.createYUIButton(parent, "create-button", parent.onCreateClick);
            
            // Add Ctrl-Enter listener
            YAHOO.util.Event.on(parent.widgets.userData, "keyup", function (e) {
               if (e.keyCode && e.keyCode == 13 && (e.ctrlKey || e.metaKey) && !e.altKey) {
                    Event.stopEvent(e);
                    parent.onCreateClick(e);
                  }
              }, this
            );
            
            // Help link listener
            YAHOO.util.Event.on(parent.widgets.helpLink, "click", parent.onHelpClick, parent, true);
            
            // Form definition
            /*
            var form = new Alfresco.forms.Form(parent.id + "-options-form");
            form.setSubmitElements([parent.widgets.applyButton]);
            form.setSubmitAsJSON(true);
            form.setAJAXSubmit(true,
            {
               successCallback:
               {
                  fn: this.onSuccess,
                  scope: this
               }
            });
            form.init();
            */
         },
         
         onShow: function onShow()
         {
            parent.widgets.userData.focus();
         }
      });
      new FormPanelHandler();
      
      return this;
   };
   
   YAHOO.extend(Extras.ConsoleCreateUsers, Alfresco.ConsoleTool,
   {
      /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
         /**
          * Number of characters required for a search.
          * 
          * @property minSearchTermLength
          * @type int
          * @default 1
          */
         minSearchTermLength: 1
      },
      
      /**
       * Fired by YUI when parent element is available for scripting.
       * Component initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function ConsoleCreateUsers_onReady()
      {
         // Call super-class onReady() method
         Extras.ConsoleCreateUsers.superclass.onReady.call(this);
         
         // Do stuff here
      },
      
      /**
       * YUI WIDGET EVENT HANDLERS
       * Handlers for standard events fired from YUI widgets, e.g. "click"
       */
      
      /**
       * Search button click event handler
       *
       * @method onSearchClick
       * @param e {object} DomEvent
       * @param args {array} Event parameters (depends on event type)
       */
      onCreateClick: function ConsoleCreateUsers_onCreateClick(e, args)
      {
         var userData = this.widgets.userData.value;

         // Disable the create button temporarily
         this.widgets.createButton.set("disabled", true);
         
         // Build JSON Object to send to the server
         var input = {
            userdata: YAHOO.lang.trim(userData),
            type: this.widgets.dataType.options[this.widgets.dataType.selectedIndex].value,
            sendmail: this.widgets.sendEmail.checked,
            shareUri: window.location.protocol + "//" + window.location.host + Alfresco.constants.URL_CONTEXT
         };

         Alfresco.util.Ajax.request(
         {
            url: Alfresco.constants.PROXY_URI + "extras/slingshot/admin/create-users",
            method: Alfresco.util.Ajax.POST,
            dataObj: input,
            requestContentType: Alfresco.util.Ajax.JSON,
            responseContentType: Alfresco.util.Ajax.JSON,
            successCallback:
            {
               fn: this.onCreateSuccess,
               scope: this
            },
            failureCallback:
            {
               fn: this.onCreateFailure,
               scope: this
            }
         });
      },
      
      /**
       * Create users success handler
       *
       * @method onCreateSuccess
       * @param response {object} Server response
       */
      onCreateSuccess: function ConsoleCreateUsers_onCreateSuccess(response)
      {
         var userList = [];
         var skippedUserList = [];
         for (var i = 0; i < response.json.users.length; i++)
         {
            userList.push(response.json.users[i].username);
         }
         for (var i = 0; i < response.json.skippedUsers.length; i++)
         {
            skippedUserList.push(response.json.skippedUsers[i].username);
         }
         Alfresco.util.PopupManager.displayPrompt({
            text: this.msg(
                     "message.success", 
                     response.json.userCount, 
                     response.json.skippedUserCount
                  ) + (response.json.skippedUserCount > 0 ? " (" + skippedUserList.join(", ") + ")" : ""),
            noEscape: false
         });
         this.widgets.createButton.set("disabled", false);
      },
      
      /**
       * Create users failure handler
       *
       * @method onCreateFailure
       * @param response {object} Server response
       */
      onCreateFailure: function ConsoleCreateUsers_onCreateFailure(response)
      {
         if (response.json.message != null)
         {
            Alfresco.util.PopupManager.displayPrompt({
               text: response.json.message
            });
         }
         else
         {
            Alfresco.util.PopupManager.displayPrompt({
               text: this.msg("message.failure")
            });
         }
         this.widgets.createButton.set("disabled", false);
      },
      
      /**
       * Help link click event handler
       *
       * @method onHelpClick
       * @param e {object} DomEvent
       * @param args {array} Event parameters (depends on event type)
       */
      onHelpClick: function ConsoleCreateUsers_onHelpClick(e, args)
      {
         Event.stopEvent(e);
         if (Dom.getStyle(this.widgets.helpText, "display") == "none")
         {
            //Dom.removeClass(this.widgets.helpText, "hidden");
            Alfresco.util.Anim.fadeIn(this.widgets.helpText);
         }
         else
         {
            Alfresco.util.Anim.fadeOut(this.widgets.helpText);
            //Dom.addClass(this.widgets.helpText, "hidden");
         }
      }
   });
})();