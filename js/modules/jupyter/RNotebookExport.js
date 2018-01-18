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
            rawR = rawR.trim();

            // Split on blank lines, not followed by whitespace (i.e. blank lines in indented blocks will stay in one cell)
            var codeChunks = rawR.split(/\n\s*\n(?!\s)/g);

            var cells = [];
            var trimmedChunk, markdownChunk, chunkWithoutHeader, cell, cellExtra;
            for (var i = 0; i < codeChunks.length; i++) {
                trimmedChunk = codeChunks[i].trim();

                if (self.isMarkdownCell(trimmedChunk)) {
                    cell = self.createMarkdownCell(trimmedChunk);
                } else {
                    [markdownChunk, chunkWithoutHeader] = self.getMarkdownFromCode(trimmedChunk);
                    if (markdownChunk) {
                        cellExtra = self.createMarkdownCell(markdownChunk);
                        cells.push(cellExtra);
                        trimmedChunk = chunkWithoutHeader;
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

            cellContent = self.formatMarkdownCell(cellContent);

            cell.source.push(cellContent);
            self.n_markdown_cells++;
            return cell;
        };

        self.formatMarkdownCell = function(cellContent) {
            // Make all but the first markdown cell a heading lower
            if (self.n_markdown_cells > 0 && cellContent[0] === '#') {
                cellContent = "#" + cellContent;
            }

            // Make cells that contain 'Get' a heading lower still
            if (cellContent.search('Get') !== -1) {
                cellContent = "#" + cellContent;
            }

            // Multi-analysis header formatter
            cellContent = cellContent.replace('----', '');

            // Single-analysis header formatter
            cellContent = cellContent.replace(/#{3,}/g,'');

            // Exception for note cell
            if (cellContent.search('TODO') !== -1) {
                cellContent = cellContent.replace(/#/g,'');
            }

            return cellContent.trim();
        };

        self.copyShallow = function(object) {
            return JSON.parse(JSON.stringify(object));
        };

        self.isMarkdownCell = function(codeLine) {
            if (codeLine.startsWith('#############################') &&
                codeLine.endsWith('#############################')) {
                return true;
            }

            return codeLine.endsWith('----');
        };

        self.getMarkdownFromCode = function(codeCell) {
            // Match a starting line ending with ----
            var matchForMulti = codeCell.match(/^.+?----\n/);
            if (matchForMulti) {
                return [matchForMulti[0],codeCell.replace(matchForMulti[0],'')]
            }

            // Match starting lines between #'s
            var matchForSingle = codeCell.match(/^#+\n.+?\n#+/);
            if (matchForSingle) {
                return [matchForSingle[0],codeCell.replace(matchForSingle[0],'')]
            }

            return [false,codeCell];
        };

        self.splitOnce = function(string, delimiter) {
            if (string === '') {
                return [''];
            }

            var index = string.search(delimiter);
            if (index === -1) {
                return string;
            }

            return [string.slice(0,index), string.slice(++index)];
        };

    }

    return RNotebookExport;
});
