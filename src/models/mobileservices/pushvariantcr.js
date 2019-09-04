import { find } from 'lodash-es';
import { CustomResource } from './customresource';

function hasPlatform(service, appName, platform) {
  return (
    service.customResources &&
    find(
      service.getCustomResourcesForApp(appName),
      cr => typeof cr.getPlatform === 'function' && cr.getPlatform() === platform
    )
  );
}

export class PushVariantCR extends CustomResource {
  constructor(data = {}) {
    super(data);
  }

  getPlatform() {
    return this.data.kind;
  }

  getConfiguration(serviceHost) {
    // TODO: need to make sure the push app id is here
    const pushAppId = this.spec.get('pushApplicationId');
    return [
      { type: 'string', label: 'Push Application Id', value: pushAppId },
      { type: 'href', label: 'UPS Admin Console URL', value: serviceHost },
      {
        type: 'href',
        label: 'Push Application',
        value: `${serviceHost}/#/app/${pushAppId}/variants`
      }
    ];
  }

  // eslint-disable-next-line class-methods-use-this
  isReady() {
    return true;
  }

  isInProgress() {
    return !this.status || !this.status.data.ready;
  }

  static bindForm(params) {
    const { service } = params;
    const hasIOS = hasPlatform(service, params.appName, 'IOSVariant');
    const hasAndroid = hasPlatform(service, params.appName, 'AndroidVariant');
    let defaultPlatform = 'Android';
    let platforms = ['Android', 'iOS'];
    const androidConfig = {
      title: 'Android',
      type: 'object',
      properties: {
        googlekey: {
          title: 'Your Server Key for Firebase Cloud Messaging',
          type: 'string'
        },
        projectNumber: {
          title: 'Your Sender ID, needed to connecting to FCM',
          type: 'string'
        }
      }
    };
    const iosConfig = {
      type: 'object',
      title: 'iOS',
      properties: {
        cert: {
          title: 'iOS .p12 file (encode contents in base64 before pasting)',
          type: 'string'
        },
        passphrase: {
          title: 'The passphrase',
          type: 'string'
        },
        iosIsProduction: {
          default: false,
          title: 'Is this a production certificate?',
          type: 'boolean'
        }
      }
    };
    let platformConfig = androidConfig;
    if (hasIOS && hasAndroid) {
      platforms = [];
      defaultPlatform = '';
    } else if (hasIOS) {
      defaultPlatform = 'Android';
      platforms = ['Android'];
      platformConfig = androidConfig;
    } else if (hasAndroid) {
      defaultPlatform = 'iOS';
      platforms = ['iOS'];
      platformConfig = iosConfig;
    }
    const schema = {
      additionalProperties: false,
      properties: {
        CLIENT_ID: {
          title: 'Mobile Client ID',
          type: 'string',
          default: params.appName
        },
        CLIENT_TYPE: {
          default: defaultPlatform,
          enum: platforms,
          title: 'Mobile Client Type',
          type: 'string'
        },
        platformConfig
      },
      type: 'object'
    };
    return {
      schema,
      uiSchema: {
        CLIENT_ID: {
          'ui:readonly': true
        },
        platformConfig: {
          // TODO: should change this to a file field and extract the content automatically
          cert: {
            'ui:widget': 'textarea'
          },
          passphrase: {
            'ui:widget': 'password'
          }
        }
      },
      onChangeHandler(formData, oldSchema) {
        const s = oldSchema;
        if (oldSchema.properties.platformConfig.title === 'Android' && formData.CLIENT_TYPE === 'iOS') {
          s.properties.CLIENT_TYPE.default = 'iOS';
          s.properties.platformConfig = iosConfig;
          return s;
        } else if (oldSchema.properties.platformConfig.title === 'iOS' && formData.CLIENT_TYPE === 'Android') {
          s.properties.CLIENT_TYPE.default = 'Android';
          s.properties.platformConfig = androidConfig;
          return s;
        }
        return null;
      },
      validationRules: {
        UPSCOMMON: {
          comment: 'This set of rules is always executed when service is UPS. It is used to validate common fields.',
          fields: {
            CLIENT_ID: {
              validation_rules: [
                {
                  type: 'required'
                }
              ]
            },
            CLIENT_TYPE: {
              validation_rules: [
                {
                  type: 'required'
                }
              ]
            }
          }
        },
        IOS_UPS_BINDING: {
          comment: 'This is the set of rules that will be used to validate IOS UPS Binding.',
          executionConstraints: [
            {
              comment: "Execute this ruleset only when the field named 'CLIENT_TYPE' has value 'IOS'",
              type: 'FIELD_VALUE',
              name: 'CLIENT_TYPE',
              value: 'iOS'
            }
          ],
          fields: {
            platformConfig: {
              cert: {
                comment: "Errors relative to this field should be bound to the key 'iosIsProduction'",
                validation_rules: [
                  {
                    type: 'required',
                    error: 'APNS requires a certificate.'
                  },
                  {
                    type: 'P12VALIDATOR',
                    error: 'Invalid PKCS#12 data or bad password',
                    password_field: 'platformConfig.passphrase'
                  }
                ]
              },
              passphrase: {
                validation_rules: [
                  {
                    type: 'required',
                    error: 'APNS certificate passphrase is required.'
                  }
                ]
              }
            }
          }
        },
        ANDROID_UPS_BINDING: {
          comment: 'This is the set of rules that will be used to validate Android UPS Binding.',
          executionConstraints: [
            {
              comment: "Execute this ruleset only when the field named 'CLIENT_TYPE' has value 'Android'",
              type: 'FIELD_VALUE',
              name: 'CLIENT_TYPE',
              value: 'Android'
            }
          ],
          fields: {
            platformConfig: {
              googlekey: {
                validation_rules: [
                  {
                    type: 'required',
                    error: 'FCM requires a Server Key.'
                  }
                ]
              },
              projectNumber: {
                validation_rules: [
                  {
                    type: 'required',
                    error: 'FCM requires a Sender ID..'
                  }
                ]
              }
            }
          }
        }
      }
    };
  }

  static newInstance(params) {
    const { CLIENT_ID, CLIENT_TYPE } = params;

    switch (CLIENT_TYPE) {
      case 'Android':
        return {
          apiVersion: 'push.aerogear.org/v1alpha1',
          kind: 'AndroidVariant',
          metadata: {
            name: `${CLIENT_ID}-android-ups-variant`
          },
          spec: {
            description: 'UPS Android Variant',
            serverKey: params.platformConfig.googlekey,
            senderId: '',
            pushApplicationId: null
          }
        };
      case 'iOS':
        return {
          apiVersion: 'push.aerogear.org/v1alpha1',
          kind: 'IOSVariant',
          metadata: {
            name: `${CLIENT_ID}-ios-ups-variant`
          },
          spec: {
            description: 'UPS iOS Variant',
            certificate: params.platformConfig.cert,
            passphrase: params.platformConfig.passphrase,
            production: params.platformConfig.iosIsProduction,
            pushApplicationId: null
          }
        };
      default:
        return {};
    }
  }

  static getDocumentationUrl() {
    return 'https://docs.aerogear.org/external/apb/unifiedpush.html';
  }
}
