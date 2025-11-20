# Daily Dashboard

## Recent Logs

```dataview
TABLE file.day AS "Date", weather AS "Weather", mood AS "Mood"
FROM "demo/daily"
SORT file.day desc
```

## Pending Tasks

Tasks extracted from daily notes that are not yet completed.

```dataview
TABLE item.text AS "Task", file.link AS "Source"
FROM "demo/daily"
FLATTEN file.lists as item
WHERE item.task = " "
```
