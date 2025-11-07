export const apiDocumentation = {
  openapi: '3.0.0',
  info: {
    title: 'Wedding Invitation API',
    version: '1.0.0',
    description: 'API for managing digital wedding invitations'
  },
  paths: {
    '/api/confirmations/confirm': {
      post: {
        tags: ['Confirmations'],
        summary: 'Confirm attendance for an invitation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['invitation_code', 'guest_name', 'guest_email', 'confirmed'],
                properties: {
                  invitation_code: {
                    type: 'string',
                    description: 'Format: {groom initial}{bride initial}{ddmmyy}',
                    example: 'JJ251225'
                  },
                  guest_name: {
                    type: 'string',
                    example: 'Alice Smith'
                  },
                  guest_email: {
                    type: 'string',
                    format: 'email',
                    example: 'alice@example.com'
                  },
                  phone: {
                    type: 'string',
                    example: '+6281234567890'
                  },
                  plus_one: {
                    type: 'boolean',
                    example: false
                  },
                  dietary_restrictions: {
                    type: 'string',
                    example: 'Vegetarian'
                  },
                  confirmed: {
                    type: 'boolean',
                    example: true
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Attendance confirmed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['success'],
                      example: 'success'
                    },
                    message: {
                      type: 'string',
                      example: 'Attendance confirmed successfully'
                    },
                    data: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                          example: '123e4567-e89b-12d3-a456-426614174000'
                        },
                        confirmation_code: {
                          type: 'string',
                          description: 'Format: {groom initial}{bride initial}{ddmmyy}',
                          example: 'JJ251225'
                        },
                        guest_name: {
                          type: 'string',
                          example: 'Alice Smith'
                        },
                        guest_email: {
                          type: 'string',
                          example: 'alice@example.com'
                        },
                        confirmed: {
                          type: 'boolean',
                          example: true
                        },
                        qr_code: {
                          type: 'string',
                          description: 'Base64 encoded QR code image',
                          example: 'data:image/png;base64,...'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['error'],
                      example: 'error'
                    },
                    message: {
                      type: 'string',
                      example: 'Validation failed'
                    },
                    error: {
                      type: 'string',
                      example: 'invitation_code, guest_name, and guest_email are required'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  },
                  password: {
                    type: 'string',
                    minLength: 8,
                    example: 'SecurePass123!'
                  },
                  name: {
                    type: 'string',
                    example: 'John Doe'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'User registered successfully'
                    },
                    user: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                          example: '123e4567-e89b-12d3-a456-426614174000'
                        },
                        email: {
                          type: 'string',
                          example: 'user@example.com'
                        },
                        name: {
                          type: 'string',
                          example: 'John Doe'
                        }
                      }
                    },
                    token: {
                      type: 'string',
                      example: 'eyJhbGciOiJIUzI1NiIs...'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/confirmations/generate-qr': {
      get: {
        tags: ['Confirmations'],
        summary: 'Generate QR code for a confirmation',
        parameters: [
          {
            name: 'confirmation_code',
            in: 'query',
            required: true,
            schema: {
              type: 'string'
            },
            example: 'CONF12345678',
            description: 'Unique confirmation code'
          }
        ],
        responses: {
          '200': {
            description: 'QR code generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['success'],
                      example: 'success'
                    },
                    message: {
                      type: 'string',
                      example: 'QR code generated successfully'
                    },
                    data: {
                      type: 'object',
                      properties: {
                        qr_code: {
                          type: 'string',
                          description: 'Base64 encoded QR code image',
                          example: 'data:image/png;base64,...'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid confirmation code',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['error'],
                      example: 'error'
                    },
                    message: {
                      type: 'string',
                      example: 'Invalid confirmation code'
                    },
                    error: {
                      type: 'string',
                      example: 'Confirmation code not found'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/confirmations/verify': {
      get: {
        tags: ['Confirmations'],
        summary: 'Verify a confirmation code',
        parameters: [
          {
            name: 'code',
            in: 'query',
            required: true,
            schema: {
              type: 'string'
            },
            example: 'CONF12345678',
            description: 'Confirmation code to verify'
          }
        ],
        responses: {
          '200': {
            description: 'Confirmation verified successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['success'],
                      example: 'success'
                    },
                    message: {
                      type: 'string',
                      example: 'Confirmation verified successfully'
                    },
                    data: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                          example: '123e4567-e89b-12d3-a456-426614174000'
                        },
                        guest_name: {
                          type: 'string',
                          example: 'Alice Smith'
                        },
                        guest_email: {
                          type: 'string',
                          example: 'alice@example.com'
                        },
                        confirmed: {
                          type: 'boolean',
                          example: true
                        },
                        attended: {
                          type: 'boolean',
                          example: false
                        },
                        plus_one: {
                          type: 'boolean',
                          example: false
                        },
                        dietary_restrictions: {
                          type: 'string',
                          example: 'Vegetarian'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid confirmation code',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['error'],
                      example: 'error'  
                    },
                    message: {
                      type: 'string',
                      example: 'Invalid confirmation code'
                    },
                    error: {
                      type: 'string', 
                      example: 'Confirmation code not found'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/confirmations/check-in': {
      post: {
        tags: ['Confirmations'],
        summary: 'Check in a guest using QR code (No authentication required)',
        description: 'Process guest check-in using QR code. Validates invitation_code to ensure guest belongs to the correct event.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['qr_code'],
                properties: {
                  qr_code: {
                    type: 'string',
                    description: 'Base64 encoded QR code data URL containing invitation_code and confirmation_code',
                    example: 'data:text/plain;base64,eyJ0eXBlIjoid2VkZGluZ19jb25maXJtYXRpb24iLCJpbnZpdGF0aW9uX2NvZGUiOiJKSjI1MTIyNSIsImNvbmZpcm1hdGlvbl9jb2RlIjoiQ09ORjEyMzQ1NiIsImd1ZXN0X2VtYWlsIjoiYWxpY2VAZXhhbXBsZS5jb20iLCJ0aW1lc3RhbXAiOiIyMDI1LTEyLTI1VDEyOjAwOjAwWiJ9'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Guest checked in successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['success'],
                      example: 'success'
                    },
                    message: {
                      type: 'string',
                      example: 'Guest checked in successfully'
                    },
                    data: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                          example: '123e4567-e89b-12d3-a456-426614174000'
                        },
                        confirmation_code: {
                          type: 'string',
                          example: 'CONF123456'
                        },
                        guest_name: {
                          type: 'string',
                          example: 'Alice Smith'
                        },
                        guest_email: {
                          type: 'string',
                          example: 'alice@example.com'
                        },
                        phone: {
                          type: 'string',
                          example: '+6281234567890'
                        },
                        plus_one: {
                          type: 'boolean',
                          example: false
                        },
                        dietary_restrictions: {
                          type: 'string',
                          example: 'Vegetarian'
                        },
                        checked_in_at: {
                          type: 'string',
                          format: 'date-time',
                          example: '2024-01-01T12:00:00Z'
                        },
                        invitation: {
                          type: 'object',
                          properties: {
                            groom_name: {
                              type: 'string',
                              example: 'John Smith'
                            },
                            bride_name: {
                              type: 'string',
                              example: 'Jane Doe'
                            },
                            ceremony_date: {
                              type: 'string',
                              format: 'date',
                              example: '2024-12-25'
                            },
                            location: {
                              type: 'string',
                              example: 'Grand Ballroom'
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request or guest already checked in',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          enum: ['error'],
                          example: 'error'
                        },
                        message: {
                          type: 'string',
                          example: 'Guest already checked in'
                        },
                        data: {
                          type: 'object',
                          properties: {
                            guest_name: {
                              type: 'string',
                              example: 'Alice Smith'
                            },
                            checked_in_at: {
                              type: 'string',
                              format: 'date-time',
                              example: '2024-01-01T12:00:00Z'
                            }
                          }
                        }
                      }
                    },
                    {
                      type: 'object',
                      properties: {
                        error: {
                          type: 'string',
                          example: 'Invalid QR code format or content'
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '404': {
            description: 'Confirmation not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'Confirmation not found'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  },
                  password: {
                    type: 'string',
                    example: 'SecurePass123!'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: {
                      type: 'string',
                      example: 'eyJhbGciOiJIUzI1NiIs...'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/invitations/view/{code}': {
      get: {
        tags: ['Public'],
        summary: 'View invitation details (Public)',
        parameters: [
          {
            name: 'code',
            in: 'path',
            required: true,
            description: 'The invitation code',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Public invitation details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    invitation: {
                      type: 'object',
                      properties: {
                        invitation_code: {
                          type: 'string',
                          example: 'DI251224'
                        },
                        groom_name: {
                          type: 'string',
                          example: 'John Smith'
                        },
                        bride_name: {
                          type: 'string',
                          example: 'Jane Doe'
                        },
                        ceremony_date: {
                          type: 'string',
                          format: 'date',
                          example: '2024-12-25'
                        },
                        ceremony_date_formatted: {
                          type: 'string',
                          example: 'Rabu, 25 Desember 2024'
                        },
                        ceremony_time: {
                          type: 'string',
                          example: '18:00'
                        },
                        location: {
                          type: 'string',
                          example: 'Grand Ballroom'
                        },
                        description: {
                          type: 'string',
                          example: 'Please join us on our special day'
                        },
                        max_guests: {
                          type: 'number',
                          example: 100
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Invitation not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'Invitation not found'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/invitations/{code}': {
      get: {
        tags: ['Invitations'],
        summary: 'Get invitation by code',
        security: [
          {
            bearerAuth: []
          }
        ],
        parameters: [
          {
            name: 'code',
            in: 'path',
            required: true,
            description: 'The invitation code',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Invitation details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    invitation: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string'
                        },
                        invitation_code: {
                          type: 'string'
                        },
                        groom_name: {
                          type: 'string'
                        },
                        bride_name: {
                          type: 'string'
                        },
                        ceremony_date: {
                          type: 'string',
                          format: 'date'
                        },
                        ceremony_time: {
                          type: 'string'
                        },
                        location: {
                          type: 'string'
                        },
                        description: {
                          type: 'string'
                        },
                        max_guests: {
                          type: 'number'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized - Invalid or missing token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'Missing authorization token'
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Invitation not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'Invitation not found'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/invitations': {
      post: {
        tags: ['Invitations'],
        summary: 'Create new invitation',
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['groom_name', 'bride_name', 'ceremony_date', 'ceremony_time', 'location'],
                properties: {
                  groom_name: {
                    type: 'string',
                    example: 'John Smith'
                  },
                  bride_name: {
                    type: 'string',
                    example: 'Jane Doe'
                  },
                  ceremony_date: {
                    type: 'string',
                    format: 'date',
                    example: '2024-12-25'
                  },
                  ceremony_time: {
                    type: 'string',
                    example: '18:00'
                  },
                  location: {
                    type: 'string',
                    example: 'Grand Ballroom'
                  },
                  max_guests: {
                    type: 'number',
                    example: 100
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Invitation created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    invitation: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                          example: '123e4567-e89b-12d3-a456-426614174000'
                        },
                        invitation_code: {
                          type: 'string',
                          example: 'DI251224'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Invitations'],
        summary: 'Get all invitations',
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'List of invitations',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string'
                      },
                      invitation_code: {
                        type: 'string'
                      },
                      groom_name: {
                        type: 'string'
                      },
                      bride_name: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};