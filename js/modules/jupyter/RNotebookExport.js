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

        // Parameters to replace
        self.dbServer = "localhost/ohdsi";
        self.dbUser = "<user>";
        self.dbPassword = "<password>";
        self.cdmDatabaseSchema = "cdm5";
        self.resultsDatabaseSchema = "webapi";
        self.exposureTable = "cohort";
        self.outcomeTable = "cohort";
        self.outputDirectory = "./";
        self.target = "T";
        self.comparator = "C";

        // Patterns to replace
        self.parameters = {
            'localhost/ohdsi': self.dbServer,
            'joe': self.dbUser,
            'supersecret': self.dbPassword,
            'my_cdm_data': self.cdmDatabaseSchema,
            'my_results|(exposure|outcome)_database_schema': self.resultsDatabaseSchema,
            'exposure_table': self.exposureTable,
            'outcome_table': self.outcomeTable,
            '<insert your directory here>': self.outputDirectory,
            'Target': self.target,
            'Comparator': self.comparator
        };

        self.RConnectionTest = "\nconnection <- tryCatch(connect(connectionDetails), error = function(err) {cat(err$message, '\\n')})\n\
if (length(connection) == 0) {\n\
    cat('FAILED to connect','\\n')\n\
} else {\n\
    cat('Connected succesfully','\\n')\n\
}";

        self.createNotebook = function(rawR) {
            var notebook = self.copyShallow(self.notebookBase);
            rawR = self.replaceParameters(rawR);
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

            // Add a connection test to cell with database parameters
            if (cellContent.includes(self.dbPassword)) {
                cellContent += "\n" + self.RConnectionTest;
            }

            // Remove old covariate setting parameters
            if (cellContent.includes("createCovariateSettings")) {
                // cellContent = cellContent.replace(/useCovariateConditionOccurrence.+?,/, "");
                // cellContent = cellContent.replace(/useCovariateConditionEra.+?,/, "");
                // cellContent = cellContent.replace(/useCovariateDrugExposure.+?,/, "");
                // cellContent = cellContent.replace(/useCovariateDrugEra.+?,/, "");
                // cellContent = cellContent.replace(/useCovariateDrugGroup.+?,/, "");
                // cellContent = cellContent.replace(/useCovariateConditionGroup.+?,/, "");
                // cellContent = cellContent.replace(/useCovariateProcedureOccurrence.+?,/, "");
                // cellContent = cellContent.replace(/useCovariateProcedureGroup.+?,/, "");
                // cellContent = cellContent.replace(/useCovariateObservation.+?,/, "");
                // cellContent = cellContent.replace(/useCovariateMeasurement.+?,/, "");
                // cellContent = cellContent.replace(/useCovariateRiskScores.+?,/, "");

                cellContent = cellContent.replace(/useCovariateConditionOccurrence(.|\n)+?\)/, ")");

                cellContent = cellContent.replace(/useCovariateDemographics.+?,/, "");
                cellContent = cellContent.replace(/Demographics(Month|Year)/g, "DemographicsIndex$1");
                cellContent = cellContent.replace(/useCovariate/g, "use");
            }

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

        self.replaceParameters = function(string) {
            var regex;
            for (var key in self.parameters) {
                // check if the property/key is defined in the object itself, not in parent
                if (!self.parameters.hasOwnProperty(key)) {
                    continue;
                }
                regex = new RegExp('"(' + key + ')"','g');
                string = string.replace(regex, '"' + self.parameters[key] + '"');
            }
            return string;
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
