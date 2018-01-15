/**
 * Converts the raw R script to a Jupyter Notebook
 * @Author Maxim Moinat (The Hyve)
 * TODO: develop in separate repository and add unit tests
 */
define(function (require, exports) {

    function RNotebookExport() {
        var self = this;
        self.metadata =  {
            "kernelspec": {
                "display_name": "R",
                    "language": "R",
                    "name": "ir"
            },
            "language_info": {
                "codemirror_mode": "r",
                    "file_extension": ".r",
                    "mimetype": "text/x-r-source",
                    "name": "R",
                    "pygments_lexer": "r",
                    "version": "3.4.3"
            }
        };

        self.notebookBase = {"cells": [], "metadata": self.metadata, "nbformat": 4, "nbformat_minor": 2};

        self.cellBase =   {
            "cell_type": null, // "code" or "markdown" or "raw"
            "metadata": {},
            "source": []
        };

        self.exportSuccess = false;
        self.writtenToFilename = "";

        self.createNotebook = function(rawR) {
            var notebook = self.copyShallow(self.notebookBase);
            notebook.cells = self.createCodeCells(rawR);
            return notebook;
        };

        self.createCodeCells = function(rawR) {
            // Remove four spaces at start of each line
            rawR = rawR.replace(/\n {4}/g,'\n');

            // Split on blank lines, not followed by whitespace (i.e. blank lines in indented blocks will stay in one cell)
            var codeChunks = rawR.split(/\n\s*\n(?!\s)/g);

            var cells = [];
            for (var i = 0; i < codeChunks.length; i++) {
                // TODO: make markdown cell if a line ends with dashes ('----').
                cells.push(self.createCodeCell(codeChunks[i].trim()))
            }
            self.exportSuccess = true;
            return cells;
        };

        /* Below code is notebook language agnostic
        * TODO: in separate file
        * */
        self.createCodeCell = function(cellContent) {
            var codeCell = self.copyShallow(self.cellBase);
            codeCell.cell_type = "code";
            codeCell.execution_count = null;
            codeCell.outputs = [];
            // codeCell.metadata.collapsed = true;

            // TODO: split cellContent into lines?
            codeCell.source.push(cellContent);
            return codeCell;
        };

        self.createMarkdownCell = function(cellContent) {
            var cell = self.copyShallow(self.cellBase);
            cell.cell_type = "markdown";
            cell.source.push(cellContent);
            return cell;
        };

        self.copyShallow = function(object) {
            return JSON.parse(JSON.stringify(object));
        }

    }

    return RNotebookExport;
});
