import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { withCors, createCorsSuccessResponse } from '../shared/cors.ts';

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "AgriConnect API Gateway",
    description: "API Gateway pour la plateforme AgriConnect - Gestion des producteurs, parcelles, cultures et opérations agricoles",
    version: "1.0.0",
    contact: {
      name: "AgriConnect Support",
      email: "support@agriconnect.sn"
    }
  },
  servers: [
    {
      url: "https://swggnqbymblnyjcocqxi.supabase.co/functions/v1/api-gateway",
      description: "Production API Gateway"
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    "/health": {
      get: {
        summary: "Vérifier la santé de l'API",
        description: "Endpoint de santé pour vérifier que l'API Gateway fonctionne (accès public)",
        tags: ["Health"],
        responses: {
          "200": {
            description: "API en bonne santé",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "healthy" },
                    timestamp: { type: "string", format: "date-time" },
                    version: { type: "string", example: "1.0.0" },
                    message: { type: "string", example: "AgriConnect API Gateway is running" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/producers": {
      get: {
        summary: "Lister les producteurs",
        description: "Récupérer la liste des producteurs avec pagination et filtres (authentification requise)",
        tags: ["Producers"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Numéro de page",
            schema: { type: "integer", minimum: 1, default: 1 }
          },
          {
            name: "limit",
            in: "query",
            description: "Nombre d'éléments par page",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 }
          },
          {
            name: "search",
            in: "query",
            description: "Recherche par nom ou téléphone",
            schema: { type: "string" }
          },
          {
            name: "cooperative_id",
            in: "query",
            description: "Filtrer par coopérative",
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Liste des producteurs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Producer" }
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" }
                  }
                }
              }
            }
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      },
      post: {
        summary: "Créer un producteur",
        description: "Créer un nouveau producteur (authentification requise)",
        tags: ["Producers"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProducerCreate" }
            }
          }
        },
        responses: {
          "201": {
            description: "Producteur créé",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/Producer" }
                  }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      }
    },
    "/producers/{id}": {
      get: {
        summary: "Récupérer un producteur",
        description: "Récupérer les détails d'un producteur par son ID (authentification requise)",
        tags: ["Producers"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du producteur",
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Détails du producteur",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/Producer" }
                  }
                }
              }
            }
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      },
      put: {
        summary: "Mettre à jour un producteur",
        description: "Mettre à jour les informations d'un producteur (authentification requise)",
        tags: ["Producers"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du producteur",
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProducerUpdate" }
            }
          }
        },
        responses: {
          "200": {
            description: "Producteur mis à jour",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/Producer" }
                  }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      },
      delete: {
        summary: "Supprimer un producteur",
        description: "Supprimer un producteur (soft delete) (authentification requise)",
        tags: ["Producers"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du producteur",
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Producteur supprimé",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token obtenu via Supabase Auth"
      }
    },
    schemas: {
      Producer: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          profile_id: { type: "string", format: "uuid" },
          cooperative_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          phone: { type: "string" },
          gender: { type: "string", enum: ["male", "female"] },
          birth_date: { type: "string", format: "date" },
          village: { type: "string" },
          commune: { type: "string" },
          department: { type: "string" },
          region: { type: "string" },
          household_size: { type: "integer", minimum: 1 },
          farming_experience_years: { type: "integer", minimum: 0 },
          education_level: { type: "string", enum: ["none", "primary", "secondary", "higher"] },
          is_approved: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        },
        required: ["id", "profile_id", "cooperative_id", "name", "phone"]
      },
      ProducerCreate: {
        type: "object",
        properties: {
          profile_id: { type: "string", format: "uuid" },
          cooperative_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          phone: { type: "string" },
          gender: { type: "string", enum: ["male", "female"] },
          birth_date: { type: "string", format: "date" },
          village: { type: "string" },
          commune: { type: "string" },
          department: { type: "string" },
          region: { type: "string" },
          household_size: { type: "integer", minimum: 1 },
          farming_experience_years: { type: "integer", minimum: 0 },
          education_level: { type: "string", enum: ["none", "primary", "secondary", "higher"] }
        },
        required: ["profile_id", "cooperative_id", "name", "phone"]
      },
      ProducerUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          gender: { type: "string", enum: ["male", "female"] },
          birth_date: { type: "string", format: "date" },
          village: { type: "string" },
          commune: { type: "string" },
          department: { type: "string" },
          region: { type: "string" },
          household_size: { type: "integer", minimum: 1 },
          farming_experience_years: { type: "integer", minimum: 0 },
          education_level: { type: "string", enum: ["none", "primary", "secondary", "higher"] }
        }
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1 },
          limit: { type: "integer", minimum: 1 },
          total: { type: "integer", minimum: 0 },
          total_pages: { type: "integer", minimum: 0 }
        }
      }
    },
    responses: {
      BadRequest: {
        description: "Requête invalide",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string" },
                details: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      },
      Unauthorized: {
        description: "Non authentifié - Token JWT requis",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string", example: "Authentication required" },
                message: { type: "string", example: "Missing or invalid JWT token" }
              }
            }
          }
        }
      },
      Forbidden: {
        description: "Accès interdit - Permissions insuffisantes",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string", example: "Insufficient permissions" },
                message: { type: "string", example: "You don't have permission to access this resource" }
              }
            }
          }
        }
      },
      NotFound: {
        description: "Ressource non trouvée",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string", example: "Resource not found" }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: "Health",
      description: "Endpoints de santé de l'API (accès public)"
    },
    {
      name: "Producers",
      description: "Gestion des producteurs agricoles (authentification requise)"
    }
  ]
};

async function handleOpenApi(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Endpoint pour la spécification OpenAPI
  if (path === '/api-gateway-docs/openapi.json') {
    return createCorsSuccessResponse(openApiSpec);
  }

  // Interface Swagger UI
  if (path === '/api-gateway-docs' || path === '/api-gateway-docs/') {
    const swaggerHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AgriConnect API Gateway - Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #3D944B; }
        .swagger-ui .info .description { color: #666; }
        .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/api-gateway-docs/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                validatorUrl: null,
                docExpansion: "list",
                filter: true,
                showRequestHeaders: true,
                onComplete: function() {
                    console.log('AgriConnect API Gateway Documentation loaded');
                }
            });
        };
    </script>
</body>
</html>`;

    return new Response(swaggerHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      }
    });
  }

  return createCorsSuccessResponse({
    message: "AgriConnect API Gateway Documentation",
    description: "Documentation interactive de l'API Gateway AgriConnect",
    endpoints: {
      docs: "/api-gateway-docs",
      openapi: "/api-gateway-docs/openapi.json",
      health: "/api-gateway/health"
    },
    authentication: {
      public: ["/health", "/api-gateway-docs"],
      protected: ["/producers/*"],
      note: "Les endpoints protégés nécessitent un token JWT valide"
    }
  });
}

export default withCors(handleOpenApi);
