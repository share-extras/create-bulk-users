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
<p>Enter user details in CSV or JSON format</p>
<form action="${url.full}.html" method="post" enctype="multipart/form-data">
Data:<br /><textarea name="userdata" rows="20" cols="80"></textarea>
<br /><br />OR Select CSV/JSON file <input type="file" name="userfile" />
<br /><br />Type: <select name="type"><option value="csv">CSV</option><option value="json">JSON</option></select><br /><br />
<input type="checkbox" name="sendmail" checked="checked" value="1" /> Send e-mail notifications
<br /><br /><input type="submit" name="action" value="Create" />
</form>
</body>
</html>