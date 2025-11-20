# Projects Overview

## Active Projects

```dataview
TABLE status AS "Status", priority AS "Priority", lead AS "Lead", deadline AS "Deadline"
FROM "demo/projects"
WHERE status != "completed"
SORT priority desc
```

## Completed Projects

```dataview
TABLE lead AS "Lead", deadline AS "Finished Date"
FROM "demo/projects"
WHERE status = "completed"
```
