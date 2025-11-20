# Library

## Reading List

```dataview
TABLE author AS "Author", genre AS "Genre", status AS "Status"
FROM "demo/books"
WHERE status = "to-read"
```

## Read Books

```dataview
TABLE author AS "Author", rating AS "Rating"
FROM "demo/books"
WHERE status = "read"
SORT rating desc
```
