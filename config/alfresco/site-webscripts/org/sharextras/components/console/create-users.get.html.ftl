<!--[if IE]>
<iframe id="yui-history-iframe" src="${url.context}/res/yui/history/assets/blank.html"></iframe> 
<![endif]-->
<input id="yui-history-field" type="hidden" />

<#assign el=args.htmlid?html>
<script type="text/javascript">//<![CDATA[
   new Extras.ConsoleCreateUsers("${el}").setMessages(${messages});
//]]></script>
</script>

<div id="${el}-body" class="create-users-console">

	<div id="${el}-form" class="hidden">
      <div class="header-bar">
         <div class="title"><label for="${el}-userdata">${msg("label.title-form")}</label></div>
      </div>
		<div>
			<div>${msg("label.userdata")}:</div>
			<textarea id="${el}-userdata" name="userdata" class="create-users-data"></textarea>
		</div>
      <div class="create-users-options">
         <div>
            <label for="${el}-select-type">${msg("label.dataType")}:</label>
            <select id="${el}-select-type" name="type">
               <option value="csv" selected="selected">${msg("label.selectType.csv")}</option>
               <option value="json">${msg("label.selectType.json")}</option>
            </select>
            <span><a href="#" id="${el}-help-link">${msg("label.help")}</a></span>
         </div>
         <div id="${el}-format-help" class="format-help theme-bg-color-2" style="display: none">
            ${msg("message.formatHelp")}
         </div>
         <div>
            <input id="${el}-sendmail" type="checkbox" name="sendmail" checked="checked" value="1" class="checkbox" />
            <label for="${el}-sendmail">${msg("label.sendEmail")}</label>
         </div>
      </div>
      <div class="create-users-buttons">
         <button type="submit" name="${el}-create-button" id="${el}-create-button">${msg("button.create")}</button>
          ${msg("label.create.key")}
      </div>
	</div>
</div>
