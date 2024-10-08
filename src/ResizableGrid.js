import React, { useState, useRef, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './ResizableGrid.css';

const ItemType = 'GRID_ITEM';

const ResizableGridItem = ({ id, columns, onResize, moveItem, findItem }) => {
    const gridItemRef = useRef(null);
    const [isResizing, setIsResizing] = useState(false);

    const originalIndex = findItem(id).index;

    const [, drop] = useDrop({
        accept: ItemType,
        hover({ id: draggedId }) {
            if (draggedId !== id && !isResizing) {
                const { index: overIndex } = findItem(id);
                moveItem(draggedId, overIndex);
            }
        },
    });

    const [{ isDragging }, drag, preview] = useDrag({
        type: ItemType,
        item: { id, originalIndex },
        canDrag: () => !isResizing, // Disable drag while resizing
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        end: (dropResult, monitor) => {
            const { id: droppedId, originalIndex } = monitor.getItem();
            const didDrop = monitor.didDrop();
            if (!didDrop) {
                moveItem(droppedId, originalIndex);
            }
        },
    });

    drag(drop(gridItemRef));

    const handleMouseDown = (e) => {
        setIsResizing(true);
        const startX = e.clientX;
        const initialWidth = gridItemRef.current.offsetWidth;
        const containerWidth = gridItemRef.current.parentElement.offsetWidth;

        const handleMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            const newWidth = initialWidth + deltaX;
            const newColumns = Math.min(Math.max(Math.round((newWidth / containerWidth) * 12), 1), 12);
            onResize(id, newColumns);
        };

        const handleMouseUp = () => {
            setIsResizing(false); // Stop resizing
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    useEffect(() => {
        // Disable dragging while resizing
        preview(gridItemRef);
    }, [isResizing, preview]);

    return (
        <div
            ref={gridItemRef}
            className={`col-${columns} mb-3 resizable-item ${isDragging ? 'dragging' : ''}`}
        >
            <div className="resizable-content">
                <p>Item {id}</p>
                <div
                    className="resizer"
                    onMouseDown={handleMouseDown}
                />
            </div>
        </div>
    );
};

const ResizableGrid = () => {
    const [items, setItems] = useState([
        { id: 1, columns: 4 },
        { id: 2, columns: 4 },
        { id: 3, columns: 4 },
    ]);

    const moveItem = (id, atIndex) => {
        const { item, index } = findItem(id);
        const updatedItems = [...items];
        updatedItems.splice(index, 1);
        updatedItems.splice(atIndex, 0, item);
        setItems(updatedItems);
    };

    const findItem = (id) => {
        const item = items.find((i) => i.id === id);
        return {
            item,
            index: items.indexOf(item),
        };
    };

    const handleResize = (id, newColumns) => {
        setItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, columns: newColumns } : item
            )
        );
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="container">
                <div className="row">
                    {items.map((item) => (
                        <ResizableGridItem
                            key={item.id}
                            id={item.id}
                            columns={item.columns}
                            onResize={handleResize}
                            moveItem={moveItem}
                            findItem={findItem}
                        />
                    ))}
                </div>
            </div>
        </DndProvider>
    );
};

export default ResizableGrid;
