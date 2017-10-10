module.exports = {
    cookieSecret: 'we12safewrgdsfAFsdf12EE',
    gmail: {
      user: 'wh_kendny@163.com',
      password: ' ',
    },
    mongo: {
      development: {
          connectionString: 'mongodb://localhost:27017/studyExpress',
      },
      production: {
        connectionString: 'mongodb://localhost:27017/studyExpress',
      },
    },

    authProviders: {
      facebook: {
        development: {
          appId: 'your_app_id',
          appSecret: 'your_app_secret',
        },
      },
    },

    WeatherUnderground:{
      'ApiKey': '',
    },

};
