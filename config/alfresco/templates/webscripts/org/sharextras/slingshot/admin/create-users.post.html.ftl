<html>
<head>
<title>Create PSE Users</title>
<style type="text/css">
body
{
	font-family: verdana, helvetica, sans-serif;
	font-size: 0.8em;
}
</style>
</head>
<body>
<h1>Create PSE Users</h1>
<p>${userCount} users were created successfully</p>
<#if resultsLog??><p><a href="${url.context}${resultsLog.url}">View Log</a></p></#if>
<#if skippedUserCount?? && skippedUserCount gt 0><p>${skippedUserCount} users were skipped as they exist already</p></#if>
<p><a href="${url.service}">Create More</a></p>
</body>
</html>