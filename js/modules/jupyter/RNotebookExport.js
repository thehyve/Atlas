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

        self.n_code_cells = 0;
        self.n_markdown_cells = 0;

        self.createNotebook = function(rawR) {
            var notebook = self.copyShallow(self.notebookBase);
            notebook.cells = self.createCells(rawR);
            return notebook;
        };

        self.createCells = function(rawR) {
            // Remove four spaces at start of each line
            rawR = rawR.replace(/\n {4}/g,'\n');

            // Split on blank lines, not followed by whitespace (i.e. blank lines in indented blocks will stay in one cell)
            var codeChunks = rawR.split(/\n\s*\n(?!\s)/g);

            var cells = [];
            var trimmedChunk, firstLine, chunkWithoutFirstLine, cell, cellExtra;
            for (var i = 0; i < codeChunks.length; i++) {
                trimmedChunk = codeChunks[i].trim();

                if (self.isMarkdownCell(trimmedChunk)) {
                    cell = self.createMarkdownCell(trimmedChunk.replace('----', ''));
                } else {
                    [firstLine, chunkWithoutFirstLine] = self.splitOnce(trimmedChunk, /\n/);
                    console.log(firstLine);
                    if (self.isMarkdownCell(firstLine)) {
                        cellExtra = self.createMarkdownCell(firstLine.replace('----', ''));
                        cells.push(cellExtra);
                        trimmedChunk = chunkWithoutFirstLine;
                    }
                    cell = self.createCodeCell(trimmedChunk);
                }
                cells.push(cell);
            }
            return cells;
        };

        self.createCodeCell = function(cellContent) {
            var codeCell = self.copyShallow(self.cellBase);
            codeCell.cell_type = "code";
            codeCell.execution_count = null;
            codeCell.outputs = [];
            // codeCell.metadata.collapsed = true;

            codeCell.source.push(cellContent);

            self.n_code_cells++;
            return codeCell;
        };

        self.createMarkdownCell = function(cellContent) {
            var cell = self.copyShallow(self.cellBase);
            cell.cell_type = "markdown";

            // Make all but the first markdown cell a heading lower
            if (self.n_markdown_cells > 0 && cellContent[0] === '#') {
                cellContent = "#" + cellContent;
            }

            // Make cells that contain 'Get' a heading lower still
            if (cellContent.search('Get') !== -1) {
                cellContent = "#" + cellContent;
            }

            cell.source.push(cellContent);
            self.n_markdown_cells++;
            return cell;
        };

        self.copyShallow = function(object) {
            return JSON.parse(JSON.stringify(object));
        };

        self.isMarkdownCell = function(codeLine) {
            return codeLine.endsWith('----');
        };

        self.splitOnce = function(string, delimiter) {
            var index = string.search(delimiter);
            if (index === -1) {
                return string;
            }

            return [string.slice(0,index), string.slice(++index)];
        };

    }

    return RNotebookExport;
});
