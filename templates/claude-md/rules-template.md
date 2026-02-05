# {{RULE_NAME}} Template

> Regle modulaire pour un domaine specifique.
>
> Emplacement: ./.claude/rules/{{RULE_FILE}}.md
> Versionne avec Git - partage avec l'equipe

---
# Pour regles conditionnelles (optionnel):
# paths:
#   - "src/**/*.ts"
#   - "tests/**/*.test.ts"
---

## {{RULE_DOMAIN}}

### Objectif
{{RULE_DESCRIPTION}}

### Regles

- **OBLIGATOIRE**: {{RULE_1}}
- **OBLIGATOIRE**: {{RULE_2}}
- **RECOMMANDE**: {{RULE_3}}
- **INTERDIT**: {{RULE_4}}

### Exemples

**Bon:**
```{{LANGUAGE}}
{{GOOD_EXAMPLE}}
```

**Mauvais:**
```{{LANGUAGE}}
{{BAD_EXAMPLE}}
```

### References

- Documentation: @docs/{{DOC_FILE}}.md
- Standard: {{STANDARD_LINK}}

---
*Rule: {{RULE_NAME}} | v1.0*
