/** @odoo-module **/

import { reportService } from "@point_of_sale/app/utils/report_service"
import { sendToPrinter, removeExtension } from "@omni_print/network/download";
import { _t } from "@web/core/l10n/translation"

const _serviceStart = reportService.start

//replace the doAction method to send the pdf to the printer
reportService.start = function (env, { rpc, user, ui, orm, pos }) {
    const service = _serviceStart.apply(this, [env, { rpc, user, ui, orm, pos }])
    const _doAction = service.doAction
    service.doAction = async (reportXmlId, active_ids) => {
        if (reportXmlId === "account.account_invoices") {
            const [pdf, filename] = await orm.call(
                "account.move",
                "get_invoice_pdf_report_attachment",
                [active_ids]
            );
            // Convert pdf to a Blob
            const byteArray = new Uint8Array(pdf.length);
            for (let i = 0; i < pdf.length; i++) {
                byteArray[i] = pdf.charCodeAt(i);
            }
            const blob = new Blob([byteArray], { type: "application/pdf" });
            const printData = {
                file: blob,
                filename,
                reportName: reportXmlId,
                reportTitle: _t("Invoices"),
                docNames: removeExtension(filename) || ""
            };
            sendToPrinter(printData)
        }
        else {
            return _doAction(reportXmlId, active_ids)
        }
    }
    return service
}

