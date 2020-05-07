package org.webcurator.ui.tools.controller;

import org.apache.commons.httpclient.Header;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.GetMethod;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.webcurator.core.harvester.coordinator.HarvestLogManager;
import org.webcurator.core.scheduler.TargetInstanceManager;
import org.webcurator.core.store.tools.QualityReviewFacade;
import org.webcurator.core.store.tools.WCTNode;
import org.webcurator.domain.model.core.HarvestResourceDTO;
import org.webcurator.domain.model.core.HarvestResult;
import org.webcurator.ui.tools.command.ModifyHarvestCommand;
import org.webcurator.ui.tools.command.ModifyHarvestImportItemCommand;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.net.HttpURLConnection;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
public class ModifyHarvestController {
    private static final Logger log = LoggerFactory.getLogger(ModifyHarvestController.class);
    private static final int RESP_CODE_SUCCESS = 0;
    private static final int RESP_CODE_FILE_EXIST = 1;
    private static final int RESP_CODE_INVALID_REQUEST = 1000;
    private static final int RESP_CODE_ERROR_FILE_IO = 2000;
    private static final int RESP_CODE_ERROR_NETWORK_IO = 3000;
    private static final int FILE_EXIST_YES = 1;
    private static final int FILE_EXIST_NO = -1;

    @Autowired
    private HarvestLogManager harvestLogManager;

    @Autowired
    private TargetInstanceManager targetInstanceManager;

    @Autowired
    private QualityReviewFacade qualityReviewFacade;

    @Autowired
    private HarvestResourceUrlMapper harvestResourceUrlMapper;

    @Autowired
    private TreeToolControllerAttribute treeToolControllerAttribute;

    @RequestMapping(path = "/curator/tools/upload-file-stream", method = RequestMethod.POST)
    public ModifyHarvestCommand uploadFileStream(@RequestParam String fileName, @RequestParam boolean replaceFlag, @RequestBody byte[] doc) {
        ModifyHarvestCommand cmd = new ModifyHarvestCommand();
        cmd.setSrcName(fileName);
        File uploadedFilePath = new File(treeToolControllerAttribute.uploadedFilesDir, fileName);
        if (uploadedFilePath.exists()) {
            if (replaceFlag) {
                uploadedFilePath.deleteOnExit();
            } else {
                cmd.setRespCode(RESP_CODE_FILE_EXIST);
                cmd.setRespMsg(String.format("File %s has been exist, return without replacement.", cmd.getSrcName()));
                return cmd;
            }
        }

        try {
            Files.write(uploadedFilePath.toPath(), doc);
        } catch (IOException e) {
            log.error(e.getMessage());
            cmd.setRespCode(RESP_CODE_ERROR_FILE_IO);
            cmd.setRespMsg("Failed to write upload file to " + uploadedFilePath.getAbsolutePath());
            return cmd;
        }

        cmd.setRespCode(RESP_CODE_SUCCESS);
        return cmd;
    }

    @RequestMapping(path = "/curator/tools/upload-files", method = RequestMethod.POST)
    public ModifyHarvestCommand uploadFile(@RequestBody ModifyHarvestCommand cmd) {
        File uploadedFilePath = new File(treeToolControllerAttribute.uploadedFilesDir, cmd.getSrcName());
        if (uploadedFilePath.exists()) {
            if (cmd.isReplaceFlag()) {
                uploadedFilePath.deleteOnExit();
            } else {
                cmd.setRespCode(RESP_CODE_FILE_EXIST);
                cmd.setRespMsg(String.format("File %s has been exist, return without replacement.", cmd.getSrcName()));
                return cmd;
            }
        }

        String[] items = cmd.getContent().split(";");
        String base64Doc = items[1].replace("base64,", "");
        byte[] doc = Base64.getDecoder().decode(base64Doc);

        try {
            Files.write(uploadedFilePath.toPath(), doc);
        } catch (IOException e) {
            log.error(e.getMessage());
            cmd.setRespCode(RESP_CODE_ERROR_FILE_IO);
            cmd.setRespMsg("Failed to write upload file to " + uploadedFilePath.getAbsolutePath());
            return cmd;
        }

        cmd.setRespCode(RESP_CODE_SUCCESS);
        return cmd;
    }

    @RequestMapping(path = "/curator/tools/check-files", method = RequestMethod.POST)
    public List<ModifyHarvestImportItemCommand> checkFiles(@RequestBody List<ModifyHarvestImportItemCommand> listFileNames) {
        List<ModifyHarvestImportItemCommand> listResultFileNames = new ArrayList<>();
        listFileNames.forEach(e -> {
            if (e.getOption().equalsIgnoreCase("file")) {
                File uploadedFilePath = new File(treeToolControllerAttribute.uploadedFilesDir, e.getSrcName());
                if (uploadedFilePath.exists()) {
                    e.setUploadedFlag(FILE_EXIST_YES); //Exist
                } else {
                    e.setUploadedFlag(FILE_EXIST_NO); //Not exist
                }
            } else {
                e.setUploadedFlag(FILE_EXIST_YES); //For source urls, consider to exist
            }
            listResultFileNames.add(e);
        });

        return listResultFileNames;
    }

    @RequestMapping(path = "/curator/tools/modify-import", method = RequestMethod.POST)
    public ModifyHarvestCommand handle(@RequestBody ModifyHarvestCommand cmd) {
        String tmpFileName = null;

        if (cmd.getOption().equalsIgnoreCase("File")) { //import from local file
            String dataAsUrl = cmd.getContent();
            if (dataAsUrl == null || !dataAsUrl.startsWith("data")) {
                log.error("Invalid request body: " + dataAsUrl);
                cmd.setRespCode(RESP_CODE_INVALID_REQUEST);
                cmd.setRespMsg("Content nor encoded with base64 and not wrapped as Url.");
                log.error(cmd.getRespMsg());
                return cmd;
            }

            String[] items = dataAsUrl.split(";");
            String base64Doc = items[1].replace("base64,", "");
            byte[] doc = Base64.getDecoder().decode(base64Doc);
            try {
                StringBuffer buf = new StringBuffer();
                buf.append("HTTP/1.1 200 OK\n");
                buf.append("Content-Type: ");
                buf.append(cmd.getSrcType()).append("\n");
                buf.append("Content-Length: ");
                buf.append(cmd.getSrcSize()).append("\n");
                LocalDateTime ldt = LocalDateTime.ofEpochSecond(cmd.getSrcLastModified() / 1000, 0, ZoneOffset.UTC);
                OffsetDateTime odt = ldt.atOffset(ZoneOffset.UTC);
                buf.append("Date: ");
                buf.append(odt.format(DateTimeFormatter.RFC_1123_DATE_TIME)).append("\n");
                buf.append("Connection: close\n");
                tmpFileName = write2file(buf, doc);
            } catch (IOException e) {
                cmd.setRespCode(RESP_CODE_ERROR_FILE_IO);
                cmd.setRespMsg(e.getMessage());
                log.error(cmd.getRespMsg());
                return cmd;
            }
        } else { //import from source url
            GetMethod getMethod = new GetMethod(cmd.getSrcName());
            HttpClient client = new HttpClient();
            try {
                int result = client.executeMethod(getMethod);
                if (result != HttpURLConnection.HTTP_OK) {
                    cmd.setRespCode(RESP_CODE_ERROR_NETWORK_IO);
                    cmd.setRespMsg("Connect with url failed, result: " + result);
                    log.error(cmd.getRespMsg());
                    return cmd;
                }
                Header[] headers = getMethod.getResponseHeaders();
                StringBuffer buf = new StringBuffer();
                buf.append("HTTP/1.1 200 OK\n");
                String strDatetime = null;
                for (Header header : headers) {
                    buf.append(header.getName()).append(": ");
                    buf.append(header.getValue()).append("\n");
                    if (header.getName().equalsIgnoreCase("Content-Type")) {
                        cmd.setSrcType(header.getValue());
                    }
                    if (header.getName().equalsIgnoreCase("Content-Length")) {
                        cmd.setSrcSize(Long.parseLong(header.getValue()));
                    }
                    if (header.getName().equalsIgnoreCase("Date")) {
                        strDatetime = header.getValue();
                    }
                }
                byte[] content = getMethod.getResponseBody();
                if (cmd.getSrcSize() == 0) {
                    cmd.setSrcSize(content.length);
                    buf.append("Content-Length: ");
                    buf.append(cmd.getSrcSize()).append("\n");
                }

                LocalDateTime ldt = null;
                if (strDatetime == null) {
                    ldt = LocalDateTime.now();
                } else {
                    ldt = LocalDateTime.parse(strDatetime, DateTimeFormatter.RFC_1123_DATE_TIME);
                }
                OffsetDateTime odt = ldt.atOffset(ZoneOffset.UTC);
                cmd.setSrcLastModified(odt.toEpochSecond() * 1000);
                if (strDatetime == null) {
                    buf.append("Date: ");
                    buf.append(odt.format(DateTimeFormatter.RFC_1123_DATE_TIME)).append("\n");
                }
                tmpFileName = write2file(buf, content);
            } catch (Exception e) {
                cmd.setRespCode(RESP_CODE_ERROR_NETWORK_IO);
                cmd.setRespMsg(e.getMessage());
                log.error(e.getMessage());
                return cmd;
            } finally {
                getMethod.releaseConnection();
            }
        }
        cmd.setTmpFileName(tmpFileName);
        cmd.setRespCode(RESP_CODE_SUCCESS);
        return cmd;
    }

//    @RequestMapping(path = "/curator/tools/apply", method = RequestMethod.POST)
//    public ModifyHarvestCommand applyAndSave(@RequestParam("job") long job, @RequestParam("harvestResultNumber") int harvestResultNumber, @RequestBody List<ModifyHarvestImportItemCommand> dataset) {
//        ModifyHarvestCommand cmd = new ModifyHarvestCommand();
//
//        final List<String> pruneUrls = new LinkedList<String>();
//        dataset.forEach(e -> {
//            if (e.getOption().equalsIgnoreCase("prune")) {
//                pruneUrls.add(e.getTargetUrl());
//            }
//        });
//
//        List<HarvestResourceDTO> importNodes = new LinkedList<HarvestResourceDTO>();
//
//        for (HarvestResourceDTO dto : tree.getImportedNodes()) {
//            hrs.add(dto);
//        }
//
//        HarvestResult result = qualityReviewFacade.copyAndPrune(command.getHrOid(), uris, hrs, command.getProvenanceNote(), tree.getModificationNotes());
//
//
//        return cmd;
//    }

    /**
     * save uploaded file as tempFileName in configured uploadedFilesDir
     *
     * @param buf:     HTTP Headers
     * @param content: content body
     * @throws IOException: when write to temp file failed
     */
    private String write2file(StringBuffer buf, byte[] content) throws IOException {
        String tempFileName = UUID.randomUUID().toString();

        File xfrFile = new File(treeToolControllerAttribute.uploadedFilesDir + tempFileName);

        FileOutputStream fos = new FileOutputStream(xfrFile);
        fos.write(buf.toString().getBytes());
        fos.write("\n".getBytes());
        fos.write(content);

        fos.close();

        return tempFileName;
    }

}