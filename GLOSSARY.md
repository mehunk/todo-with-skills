# Todo

A personal task manager: each signed-in person keeps their own lists of things to do.

## Language

**Owner**:
The signed-in person a List belongs to. Every List and Todo is visible only to its Owner.
_Avoid_: Account, member, customer

**List**:
A named collection of Todos belonging to one Owner.
_Avoid_: Project, folder, category, board

**Todo**:
A single thing to do, with a title, an optional due date, and a completed flag. Belongs to exactly one List.
_Avoid_: Task, item, entry, ticket

**Due date**:
The calendar date by which a Todo should be completed. Optional.
_Avoid_: Deadline, due time

**Completed**:
A Todo the Owner has marked done. Completion can be undone.
_Avoid_: Done, finished, checked, archived

**Overdue**:
A Todo that is not Completed and whose Due date is before the Owner's current local date.
_Avoid_: Late, expired

**Position**:
The Owner-chosen order of a Todo within its List, or of a List among the Owner's Lists.
_Avoid_: Priority, rank, index
