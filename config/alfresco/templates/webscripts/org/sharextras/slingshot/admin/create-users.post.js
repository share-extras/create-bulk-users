var s = new XML(config.script);

function getRandomNum(lbound, ubound)
{
	return (Math.floor(Math.random() * (ubound - lbound)) + lbound);
}
function getRandomChar()
{
   var chars = s["policy"]["pw-chars"].toString();
   return chars.charAt(getRandomNum(0, chars.length));
}
function getRandomPassword(n)
{
	var password = "";
	for (var i=0; i<n; i++)
	{
		password += getRandomChar();
	}
	return password;
}
function checkRequiredFields(u)
{
   var emailRe = new RegExp("^[\\w\\.\\-_+]+@[\\w\\.\\-_+]+$");
   
   // Make email lowercase
   if (typeof(u.email) != "undefined" && u.email != null)
   {
      if (emailRe.test(u.email))
      {
         u.email = u.email.toLowerCase();
      }
      else
      {
         throw "Email address " + u.email + " is not a valid format";
      }
   }
   
   // Auto-generate a password if not specified
   if (u.password == null || u.password == "")
   {
      var pwlen = parseInt(s["policy"]["pw-length"].toString(), 10);
      u.password = getRandomPassword(pwlen);
   }
   var tmplParams = new Array(6);
   tmplParams["firstName"] = u.firstName;
   tmplParams["lastName"] = u.lastName;
   if (typeof(u.email) != "undefined" && u.email != null)
   {
      tmplParams["email"] = u.email;
      tmplParams["emailFull"] = u.email;
      tmplParams["emailName"] = u.email.substring(0, u.email.indexOf("@"));
      tmplParams["emailDomain"] = u.email.substring(u.email.indexOf("@") + 1);
   }
   // Auto-generate a user name from email if not specified
   if (u.username == null || u.username == "")
   {
      var usernameTmpl = s["policy"]["username-template"];
      if (usernameTmpl != null && usernameTmpl.toString() != "")
      {
         u.username = companyhome.processTemplate(usernameTmpl.toString(), tmplParams);
      }
      else
      {
         throw "Username was not specified but no template is available";
      }
   }
}
function createUser(u)
{
   // TODO Support custom home folders
	return people.createPerson(u.username, u.firstName, u.lastName, u.email, u.password, true);
}
function mailUserNotification(u, params)
{
	// create mail action
	var mail = actions.create("mail");
	mail.parameters.to = u.email;
	mail.parameters.subject = s["mail-params"]["subject"].toString() || msg.get("email.subject");
	mail.parameters.from = s["mail-params"]["from-address"].toString(); // Only used if the executing user has no email address assigned
   var mailTmplPath = s["mail-params"]["template-path"];
   // Use mail tmpl from config, fall back to msg.get("email.template")
   var mailtmpl = null;
   if (mailTmplPath != null && mailTmplPath.toString() != "")
   {
      var mailTmplResults = search.query({
         query: "PATH:\"" + mailTmplPath.toString() + "\"",
         language: "fts-alfresco"
      });
      if (mailTmplResults.length == 1)
      {
         mailtmpl = mailTmplResults[0];
      }
   }
   else
   {
      mailtmpl = msg.get("email.template");
   }
	if (mailtmpl == null)
	{
		throw "Mail template not found";
	}
	var uargs = {
	      "firstName" : u.firstName,
	      "lastName" : u.lastName,
	      "email" : u.email,
	      "username" : u.username,
	      "password" : u.password,
         "shareUri" : params.shareUri
   };
	mail.parameters.text = companyhome.processTemplate(mailtmpl, uargs);
	// execute action against a space
	mail.execute(companyhome);
}
function addUserToGroup(u, groupName)
{
	var group = people.getGroup(groupName);
	if (group == null)
	{
		throw "Group '" + groupName + "' not found";
	}
	people.addAuthority(group, u);
}
function logResults(users, params)
{
	var logContent = "",
	   logContentTmpl = s["logging"]["format"], // Logging format
      logFileTmpl = s["logging"]["filename-template"], // Log file name
      logFileLocation = s["logging"]["location"], // Log folder
      tmplContentParams,
      tmplParams,
      d = new Date(),
      logFileName,
      logFolder;
   
   if (logContentTmpl == null || logContentTmpl.toString() == "")
   {
      throw "No log content template available";
   }
   
	for (var i=0; i<users.length; i++)
	{
	   tmplContentParams = {
	      firstName: users[i].firstName,
	      lastName: users[i].lastName,
	      email: users[i].email,
	      username: users[i].username,
	      password: users[i].password,
         timestamp: "" + d.getTime(),
         dateString: d.toString(),
         sentEmail: params.sendEmail,
         shareUri: params.shareUri
	   };
	   logContent += (companyhome.processTemplate(logContentTmpl.toString(), tmplContentParams) + "\n");
	}

   tmplParams = {
      date: d,
      timestamp: "" + d.getTime(),
      year: "" + d.getFullYear(),
      month: "" + d.getMonth() < 9 ? "0" + (d.getMonth() + 1) : "" + (d.getMonth() + 1),
      date: "" + d.getDate() < 10 ? "0" + d.getDate() : "" + d.getDate(),
      hours: "" + d.getHours() < 10 ? "0" + d.getHours() : "" + d.getHours(),
      minutes: "" + d.getMinutes() < 10 ? "0" + d.getMinutes() : "" + d.getMinutes(),
      seconds: "" + d.getSeconds() < 10 ? "0" + d.getSeconds() : "" + d.getSeconds()
   };
   
   if (logFileTmpl != null && logFileTmpl.toString() != "")
   {
      logFileName = companyhome.processTemplate(logFileTmpl.toString(), tmplParams);
   }
   else
   {
      throw "No log file template is available";
   }
   if (logFileLocation != null && logFileLocation.toString() != "")
   {
      var locParts = ("" + logFileLocation.toString()).split(":");
      if (locParts[0] == "companyhome")
      {
         logFolder = companyhome;
      }
      else if (locParts[0] == "userhome")
      {
         logFolder = userhome;
      }
      else
      {
         throw "Log file location must start with companyhome or userhome";
      }
      if (locParts.length > 1 && locParts[1] != "" && locParts[1] != "/")
      {
         var qnamePath = logFolder.qnamePath + (locParts[1].indexOf("/") == 0 ? locParts.slice(1, locParts.length).join(":") : "/" + locParts.slice(1, locParts.length).join(":")),
               logFolderResults = search.query({
                  query: "PATH:\"" + qnamePath + "\"",
                  language: "fts-alfresco"
               });
         if (logFolderResults.length == 1)
         {
            logFolder = logFolderResults[0];
         }
         else
         {
            throw "Log file location " + qnamePath + " not found";
         }
      }
   }
   // Try to access the existing file, if not found then create the file
	var logFile = logFolder.childByNamePath(logFileName);
	if (logFile == null)
	{
	   logFile = logFolder.createFile(logFileName);
	}
	logFile.content += logContent;
	logFile.save();
	return logFile;
}
function usersFromCsv(text)
{
	// Check that required fields all present
   // Use fields list from config
	var u, users = [], skippedusers = [], fname,
	   re = /\s*[\r\n]+\s*/m,
	   lines = text.split(re),
	   reqfields = s["policy"]["fields"].toString().split(/\s*[,]\s*/);
	
	for (var i=0; i<lines.length; i++)
	{
	   u = {};
		if (lines[i].length > 0) // Skip empty lines
		{
			var fields = lines[i].split(/\s*[,\t]\s*/);
			
		   for (var j = 0; j < reqfields.length; j++)
         {
            fname = reqfields[j];
            if (fname != "")
            {
               if (j < fields.length && fields[j] != "")
               {
                  u[fname.replace(/\?$/, "")] = fields[j];
               }
               else
               {
                  if (fname.lastIndexOf("?") != fname.length - 1) // Does it NOT end with a ?
                  {
                     throw "Field '" + fname + "' is not specified for user " + (i + 1);
                  }
               }
            }
         }
			
			users.push (u);
		}
	}
	return users;
}
function usersFromJson(text)
{
	var users = eval(text),
      reqfields = s["policy"]["fields"].toString().split(/\s*[,]\s*/),
      fname;

	// Check that required fields all present
	for (var i=0; i<users.length; i++)
	{
	   for (var j = 0; j < reqfields.length; j++)
      {
	      fname = reqfields[j];
         if ((typeof(users[i][fname]) == "undefined" || users[i][fname] == null || users[i][fname] == "") 
            && fname.lastIndexOf("?") != fname.length - 1) // Does it NOT end with a ?
         {
            throw "Field '" + fname + "' is not specified for user " + (i + 1);
         }
      }
	}
	return users;
}
/**
 * Check whether the given user is a member of the given group
 * 
 * @param u {object} Person node retreived from the repo using people.getPerson()
 * @param g {object} Group node retreived using people.getGroup()
 * @return  true if the user is a member of the group (directly or via a sub-group), false if not
 */
function userIsMember(u, g)
{
	var members = people.getMembers(g);
	for (var i=0; i<members.length; i++)
	{
		if (members[i].properties.userName == u.properties.userName)
		{
			return true;
		}
	}
	return false;
}
/**
 * Add a number to the given username (starting with 1) and keep incrementing this
 * until it is found to be unique in the system, i.e. no other user has this
 * username.
 * 
 * @param u {string} The original username
 * @return {string} The first unique username with a number appended
 */
function numerateUsername(username)
{
   var n = 1;
   while (people.getPerson(username + n) != null)
   {
      n++;
   }
   return username + n;
}
/**
 * Main script entry point
 * 
 * @return
 */
function main()
{
   var allowedGroupName = s["policy"]["required-group"];
   if (allowedGroupName != null && allowedGroupName.toString() != "")
   {
   	var allowedGroup = people.getGroup(allowedGroupName);
   	
   	if (allowedGroup == null)
   	{
   	   status.setCode(500);
   	   status.setMessage(allowedGroupName + " group not found");
   	   status.setRedirect(true);
   	   return;
   	}
   	else
   	{
   		if (!userIsMember(person, allowedGroup))
   		{
   		   status.setCode(401);
   		   status.setMessage("User not found in " + allowedGroupName + " group");
   		   status.setRedirect(true);
   		   return;
   		}
   	}
   }
   
	var jsonData = null;
   if (requestbody.content.indexOf("{") == 0)
   {
      jsonData = jsonUtils.toObject(requestbody.content);
   }
   
	var userdata = jsonData != null ? jsonData.userdata : args.userdata,
	      dataFormat = jsonData != null ? jsonData.type : args.type,
         sendEmail = jsonData != null ? jsonData.sendmail : args.sendmail,
         shareUri = jsonData != null ? jsonData.shareUri : args.shareUri;
	
	// Allow Share URI to be overridden in config
	if (s["mail-params"]["template-params"]["shareUri"] != null && 
	      s["mail-params"]["template-params"]["shareUri"].toString() != "")
	{
	   shareUri = s["mail-params"]["template-params"]["shareUri"].toString();
	}
	
	// Is logging enabled?
	var loggingEnabled = false;
   if (s["logging"] != null && s["logging"]["enabled"] != null && s["logging"]["enabled"].toString() == "true")
   {
      loggingEnabled = true;
   }
	
	// Check for file upload if no manual data
	if (userdata == "" && typeof(formdata) != "undefined" && formdata.hasField("userfile"))
	{
		for each (field in formdata.fields)
		{
			if (field.name == "userfile")
			{
				userdata = "" + field.content.content;
			}
		}
	}
	
	var u, 
	   users = (dataFormat == "json" ? usersFromJson(userdata) : usersFromCsv(userdata)), 
	   processedusers = [], 
	   skippedusers = [],
	   create,
	   existingUser;
	
	try
	{
		for (var i=0; i<users.length; i++)
		{
		   checkRequiredFields(users[i]);
		   create = false;
         // Check the user does not exist already
         existingUser = people.getPerson(users[i].username);
         if (!existingUser)
         {
            create = true;
         }
         else
         {
            var cdPolicy = s["policy"]["username-collisions"].toString();
            // Apply collision-detection policy from config
            // Skip all duplicates
            if (cdPolicy == "ignore")
            {
               skippedusers.push(users[i]);
            }
            else if (cdPolicy == "number")
            {
               users[i].username = numerateUsername(users[i].username);
               create = true;
            }
            else if (cdPolicy == "error")
            {
               throw "Could not create user " + users[i].username + " as another user already exists with this username";
            }
               // If e-mails are the different, throw an error, otherwise assume this is the same person and skip
            else if (cdPolicy == "error-different-email")
            {
               if (existingUser.properties.email != users[i].email || existingUser.properties.email == "" || users[i].email == "")
               {
                  throw "Could not create user " + users[i].username + " as another user already exists with this username";
               }
               else
               {
                  skippedusers.push(users[i]);
               }
            }
            // If e-mails are the different, add a number to the username, otherwise assume this is the same person and skip
            else if (cdPolicy == "number-different-email")
            {
               if (existingUser.properties.email == "" || users[i].email == "")
               {
                  throw "Could not create user " + users[i].username + " as the email data was incomplete";
               }
               else if (existingUser.properties.email != users[i].email)
               {
                  users[i].username = numerateUsername(users[i].username);
                  create = true;
               }
               else
               {
                  skippedusers.push(users[i]);
               }
            }
            else
            {
               throw "Invalid collision detection policy " + cdPolicy;
            }
         }
         
         if (create)
         {
            u = createUser(users[i]);
            
            if (u == null)
            {
               throw "Could not create user " + users[i].username + " - an unknown error occurred";
            }
            else
            {
               // User was created successfully
               var groupNames = [];
               if (s["policy"]["default-groups"] != null && s["policy"]["default-groups"].toString() != "")
               {
                  groupNames = s["policy"]["default-groups"].toString().split(",");
               }
               for (var j = 0; j < groupNames.length; j++)
               {
                  addUserToGroup(u, groupNames[j]);
               }
               processedusers.push(users[i]);
            }
         }
		}
	}
	catch (e)
	{
		throw e;
	}
	
	// Send email notifications if we get to this point
	if (sendEmail)
	{
		for (var i=0; i<processedusers.length; i++)
		{
			mailUserNotification(processedusers[i], {
			   shareUri: shareUri
			});
		}
	}
	
	model.userCount = processedusers.length;
	model.users = processedusers;
	model.skippedUserCount = skippedusers.length;
	model.skippedUsers = skippedusers;
	if (processedusers.length > 0 && loggingEnabled)
	{
		model.resultsLog = logResults(processedusers, {
         shareUri: shareUri,
         sendEmail: sendEmail
      });
	}
}

main();