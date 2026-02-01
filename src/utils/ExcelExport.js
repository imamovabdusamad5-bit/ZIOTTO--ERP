import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName = 'planning_export') => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Plan Data");

        // Generate buffer
        XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
        return true;
    } catch (error) {
        console.error("Excel Export Error:", error);
        alert("Eksport qilishda xatolik: " + error.message);
        return false;
    }
};

export const exportComplexTable = (tableId, fileName = 'planning_table') => {
    try {
        const table = document.getElementById(tableId);
        if (!table) {
            throw new Error("Jadval topilmadi!");
        }

        const wb = XLSX.utils.table_to_book(table, { sheet: "Reja" });
        XLSX.writeFile(wb, `${fileName}_${new Date().getTime()}.xlsx`);
        return true;
    } catch (error) {
        console.error("Table Export Error:", error);
        alert("Jadvalni eksport qilishda xatolik: " + error.message);
        return false;
    }
};
