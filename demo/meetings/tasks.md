# Meeting Tasks

## All Action Items

Aggregated tasks from all meeting notes.

```dataview
TABLE item.text AS "Action Item", file.link AS "Meeting", date AS "Date"
FROM "demo/meetings"
FLATTEN file.lists as item
WHERE item.task != null
SORT date desc
```

## Open Action Items

```dataview
TABLE item.text AS "Task", attendees AS "Attendees"
FROM "demo/meetings"
FLATTEN file.lists as item
WHERE item.task = " "
```
