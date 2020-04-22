package org.webcurator.ui.tools.command;

public class ModifyHarvestCommand {
    private String targetUrl;
    private String option;
    private String srcName;
    private long srcSize;
    private String srcType;
    private long srcLastModified;
    private String content;
    private String tmpFileName;
    private int respCode;
    private String respMsg;

    public String getTargetUrl() {
        return targetUrl;
    }

    public void setTargetUrl(String targetUrl) {
        this.targetUrl = targetUrl;
    }

    public String getOption() {
        return option;
    }

    public void setOption(String option) {
        this.option = option;
    }

    public String getSrcName() {
        return srcName;
    }

    public void setSrcName(String srcName) {
        this.srcName = srcName;
    }

    public long getSrcSize() {
        return srcSize;
    }

    public void setSrcSize(long srcSize) {
        this.srcSize = srcSize;
    }

    public String getSrcType() {
        return srcType;
    }

    public void setSrcType(String srcType) {
        this.srcType = srcType;
    }

    public long getSrcLastModified() {
        return srcLastModified;
    }

    public void setSrcLastModified(long srcLastModified) {
        this.srcLastModified = srcLastModified;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getTmpFileName() {
        return tmpFileName;
    }

    public void setTmpFileName(String tmpFileName) {
        this.tmpFileName = tmpFileName;
    }

    public int getRespCode() {
        return respCode;
    }

    public void setRespCode(int respCode) {
        this.respCode = respCode;
    }

    public String getRespMsg() {
        return respMsg;
    }

    public void setRespMsg(String respMsg) {
        this.respMsg = respMsg;
    }
}
