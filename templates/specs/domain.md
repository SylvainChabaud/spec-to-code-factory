# Domain Specification

> Template pour docs/specs/domain.md
> Remplacer {{PLACEHOLDER}} par les valeurs du projet

## Concepts clés

### Glossaire métier

| Terme | Définition | Exemple |
|-------|------------|---------|
| {{Terme 1}} | {{Définition}} | {{Exemple concret}} |
| {{Terme 2}} | {{Définition}} | {{Exemple concret}} |

### Bounded Contexts

```
{{Diagramme des bounded contexts}}
```

## Entités

### {{Entité 1}}

**Description** : {{Description de l'entité}}

**Attributs** :

| Attribut | Type | Obligatoire | Description |
|----------|------|-------------|-------------|
| id | UUID | Oui | Identifiant unique |
| {{attr}} | {{type}} | {{Oui/Non}} | {{description}} |

**Règles métier** :
- {{Règle 1}}
- {{Règle 2}}

**Relations** :
- {{Relation avec autre entité}}

### {{Entité 2}}

{{Répéter le pattern ci-dessus}}

## Agrégats

### {{Agrégat 1}}

**Racine** : {{Entité racine}}

**Composants** :
- {{Entité 1}}
- {{Entité 2}}

**Invariants** :
- {{Invariant 1 - règle qui doit toujours être vraie}}
- {{Invariant 2}}

## Value Objects

| Value Object | Attributs | Validation |
|--------------|-----------|------------|
| {{Nom}} | {{attr1, attr2}} | {{Règles de validation}} |

## Domain Events

| Event | Déclencheur | Données | Consommateurs |
|-------|-------------|---------|---------------|
| {{Nom}} | {{Action}} | {{Payload}} | {{Services}} |

## Domain Services

| Service | Responsabilité | Entités concernées |
|---------|---------------|-------------------|
| {{Nom}} | {{Description}} | {{Entité1, Entité2}} |

## Règles métier transverses

1. **{{Nom règle}}** : {{Description détaillée}}
2. **{{Nom règle}}** : {{Description détaillée}}
