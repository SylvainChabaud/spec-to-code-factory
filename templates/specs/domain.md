# Domain Specification

> Template pour docs/specs/domain.md
> Remplacer {{PLACEHOLDER}} par les valeurs du projet

<!-- VERSIONING (V2+) : Encadrer tout ajout/modification avec
     <!-- VN:START --> ... <!-- VN:END -->
     où N = version courante. Garder aussi les annotations inline (VN).
     Extraction : node tools/extract-version-delta.js --version N
-->

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

## Architecture logicielle

### Style architectural

{{Clean Architecture / Hexagonal / Layered — défini par l'ADR architecture}}

### Layers et responsabilités

| Layer | Dossier | Responsabilité | Dépendances autorisées |
|-------|---------|----------------|----------------------|
| Domain | `src/domain/` | Entités, Value Objects, Domain Services, Events | Aucune dépendance externe |
| Application | `src/application/` | Use Cases, DTOs, Ports (interfaces) | Domain uniquement |
| Infrastructure | `src/infrastructure/` | Repositories, APIs externes, DB | Domain + Application |
| UI/Presentation | `src/components/` ou `src/ui/` | Composants, Controllers | Application (DTOs) |

### Règles de dépendance (BLOQUANT)

- Domain N'IMPORTE JAMAIS Infrastructure ni UI
- Application N'IMPORTE JAMAIS Infrastructure ni UI
- Infrastructure IMPLÉMENTE les ports définis dans Application
- Les imports cross-layer interdits sont vérifiés par Gate 4

### Relations entre Bounded Contexts

| Context Source | Context Cible | Type de relation |
|---------------|---------------|-----------------|
| {{Context A}} | {{Context B}} | {{Upstream/Downstream/Conformist/ACL}} |
