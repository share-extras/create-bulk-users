<#escape x as jsonUtils.encodeJSONString(x)>
{
   "userCount": ${userCount?c},
   "users": [
      <#list users as u>
      {
         "firstName": "${u.firstName}",
         "lastName": "${u.lastName}",
         "email": "${u.email}",
         "username": "${u.username}"
      }<#if u_has_next>,</#if>
      </#list>
   ],
   "skippedUserCount": ${skippedUserCount?c},
   "skippedUsers": [
      <#list skippedUsers as u>
      {
         "firstName": "${u.firstName}",
         "lastName": "${u.lastName}",
         "email": "${u.email}",
         "username": "${u.username}"
      }<#if u_has_next>,</#if>
      </#list>
   ]
}
</#escape>