package org.webcurator.ui.tools.command;

public class ModifyHarvestImportItemCommand {
    private String option;
    private String targetUrl;
    private String srcName;
    private long srcLastModified;
    private boolean uploadedFlag;

    public String getOption() {
        return option;
    }

    public void setOption(String option) {
        this.option = option;
    }

    public String getTargetUrl() {
        return targetUrl;
    }

    public void setTargetUrl(String targetUrl) {
        this.targetUrl = targetUrl;
    }

    public String getSrcName() {
        return srcName;
    }

    public void setSrcName(String srcName) {
        this.srcName = srcName;
    }

    public long getSrcLastModified() {
        return srcLastModified;
    }

    public void setSrcLastModified(long srcLastModified) {
        this.srcLastModified = srcLastModified;
    }

    public boolean isUploadedFlag() {
        return uploadedFlag;
    }

    public void setUploadedFlag(boolean uploadedFlag) {
        this.uploadedFlag = uploadedFlag;
    }
}
