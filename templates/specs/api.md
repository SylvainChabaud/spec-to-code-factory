# API Specification

> Template pour docs/specs/api.md
> Remplacer {{PLACEHOLDER}} par les valeurs du projet

## Vue d'ensemble

**Base URL** : `{{https://api.example.com/v1}}`

**Versioning** : {{URL path / Header / Query param}}

**Format** : JSON (application/json)

## Authentification

### Méthode

{{Bearer Token / API Key / OAuth2 / etc.}}

### Headers requis

```
Authorization: Bearer {{token}}
X-API-Version: {{1.0}}
```

## Endpoints

### {{Resource 1}}

#### GET /{{resources}}

**Description** : {{Liste des resources}}

**Query Parameters** :

| Param | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| page | int | Non | Numéro de page (défaut: 1) |
| limit | int | Non | Items par page (défaut: 20, max: 100) |
| {{param}} | {{type}} | {{Oui/Non}} | {{description}} |

**Response 200** :

```json
{
  "data": [
    {
      "id": "{{uuid}}",
      "{{attr}}": "{{value}}"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

#### POST /{{resources}}

**Description** : {{Crée une resource}}

**Request Body** :

```json
{
  "{{attr1}}": "{{value}}",
  "{{attr2}}": "{{value}}"
}
```

**Response 201** :

```json
{
  "id": "{{uuid}}",
  "{{attr1}}": "{{value}}",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### GET /{{resources}}/{{:id}}

**Description** : {{Récupère une resource par ID}}

**Path Parameters** :

| Param | Type | Description |
|-------|------|-------------|
| id | UUID | ID de la resource |

**Response 200** :

```json
{
  "id": "{{uuid}}",
  "{{attr}}": "{{value}}"
}
```

#### PUT /{{resources}}/{{:id}}

**Description** : {{Met à jour une resource}}

**Request Body** : {{Identique à POST}}

**Response 200** : {{Resource mise à jour}}

#### DELETE /{{resources}}/{{:id}}

**Description** : {{Supprime une resource}}

**Response 204** : No Content

### {{Resource 2}}

{{Répéter le pattern ci-dessus}}

## Codes d'erreur

| Code | Signification | Exemple |
|------|--------------|---------|
| 400 | Bad Request | Validation échouée |
| 401 | Unauthorized | Token invalide |
| 403 | Forbidden | Permissions insuffisantes |
| 404 | Not Found | Resource inexistante |
| 409 | Conflict | Duplicate entry |
| 422 | Unprocessable Entity | Règle métier violée |
| 429 | Too Many Requests | Rate limit atteint |
| 500 | Internal Server Error | Erreur serveur |

## Format des erreurs

```json
{
  "error": {
    "code": "{{ERROR_CODE}}",
    "message": "{{Human readable message}}",
    "details": [
      {
        "field": "{{fieldName}}",
        "message": "{{Validation message}}"
      }
    ]
  }
}
```

## Rate Limiting

| Tier | Limite | Fenêtre |
|------|--------|---------|
| Standard | {{100}} req | {{1 minute}} |
| Premium | {{1000}} req | {{1 minute}} |

**Headers de réponse** :

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Webhooks

### Events disponibles

| Event | Payload | Description |
|-------|---------|-------------|
| {{resource}}.created | {{Resource}} | Nouvelle resource créée |
| {{resource}}.updated | {{Resource}} | Resource mise à jour |
| {{resource}}.deleted | {{id}} | Resource supprimée |

### Format du webhook

```json
{
  "event": "{{resource}}.created",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": { }
}
```
