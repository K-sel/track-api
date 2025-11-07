// AUTH ROUTES
POST  /api/auth/register
POST  /api/auth/login

// USER ROUTES
GET    /api/users/{user_id}
PATCH  /api/users/{user_id}
DELETE /api/users/{user_id}
POST   /api/users

// RECAPS ROUTES -> potentiel paginate
GET /api/recaps/{year}


// PERSONAL RECORDS ROUTES -> potentiel paginate
GET   /api/pr/all
GET   /api/pr/{activity_type} //retourne tous les records d'un certain type d'activité

// ACTIVITY ROUTES
GET    /api/activities/  //-> potentiel paginate
GET    /api/activities/{activity_id}
POST   /api/activities
PATCH  /api/activities/{activity_id}
DELETE /api/activities/{activity_id}

  // activty medias
GET    /api/activities/{activity_id}/medias
GET    /api/activities/{activity_id}/media/{media_index}
POST   /api/activities/{activity_id}/media/{media_index}
DELETE /api/activities/{activity_id}/media/{media_index}

  // activty gps traces
GET    /api/activities/{activity_id}/gps-trace
DELETE /api/activities/{activity_id}/gps-trace

// Websocket recording
WSS /record/gps-trace
WSS /record/speed
